/**
 * PCILeech Firmware Generator Documentation Site
 * 
 * This Cloudflare Worker serves the MkDocs documentation site for PCILeech FW Generator.
 * It handles static file serving, routing, and redirects.
 */

export interface Env {
	// Assets binding for static files
	ASSETS: Fetcher;
}

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.xml': 'application/xml',
	'.txt': 'text/plain',
};

function getMimeType(path: string): string {
	const ext = path.substring(path.lastIndexOf('.'));
	return MIME_TYPES[ext] || 'application/octet-stream';
}

function normalizePath(pathname: string): string {
	// Remove trailing slashes except for root
	pathname = pathname.replace(/\/+$/, '') || '/';
	
	// If it's a directory path, try to serve index.html
	if (pathname === '/' || pathname.endsWith('/') || !pathname.includes('.')) {
		if (pathname === '/') {
			return '/index.html';
		}
		return pathname.endsWith('/') ? pathname + 'index.html' : pathname + '/index.html';
	}
	
	return pathname;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		let pathname = decodeURIComponent(url.pathname);
		
		// Handle root redirect
		if (pathname === '/') {
			pathname = '/index.html';
		} else {
			pathname = normalizePath(pathname);
		}
		
		try {
			// Try to fetch the static asset
			const assetRequest = new Request(`${url.protocol}//${url.host}${pathname}`, {
				method: request.method,
				headers: request.headers,
			});
			
			const response = await env.ASSETS.fetch(assetRequest);
			
			if (response.status === 404) {
				// Try to serve 404.html for missing pages
				const notFoundRequest = new Request(`${url.protocol}//${url.host}/404.html`, {
					method: 'GET',
				});
				const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
				
				if (notFoundResponse.ok) {
					return new Response(notFoundResponse.body, {
						status: 404,
						headers: {
							'Content-Type': 'text/html; charset=utf-8',
							'Cache-Control': 'public, max-age=300',
						},
					});
				}
				
				// Fallback 404
				return new Response('Page not found', {
					status: 404,
					headers: { 'Content-Type': 'text/plain' },
				});
			}
			
			if (!response.ok) {
				return response;
			}
			
			// Set appropriate content type and caching headers
			const contentType = getMimeType(pathname);
			const headers = new Headers(response.headers);
			headers.set('Content-Type', contentType);
			
			// Set cache headers based on file type
			if (pathname.includes('assets/') || pathname.endsWith('.css') || pathname.endsWith('.js')) {
				headers.set('Cache-Control', 'public, max-age=31536000, immutable');
			} else if (pathname.endsWith('.html')) {
				headers.set('Cache-Control', 'public, max-age=300');
			} else {
				headers.set('Cache-Control', 'public, max-age=3600');
			}
			
			// Security headers
			headers.set('X-Content-Type-Options', 'nosniff');
			headers.set('X-Frame-Options', 'DENY');
			headers.set('X-XSS-Protection', '1; mode=block');
			headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
			
			return new Response(response.body, {
				status: response.status,
				headers,
			});
			
		} catch (error) {
			console.error('Error serving asset:', error);
			return new Response('Internal Server Error', {
				status: 500,
				headers: { 'Content-Type': 'text/plain' },
			});
		}
	},
};
