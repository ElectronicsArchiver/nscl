/*
 * NoScript Commons Library
 * Reusable building blocks for cross-browser security/privacy WebExtensions.
 * Copyright (C) 2020-2021 Giorgio Maone <https://maone.net>
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */


'use strict'


class CSP {
	
	static #regex_mediaBlocker = /(?:^|[\s;])media-src (?:'none'|http:)(?:;|$)/;
	static headerName = 'content-security-policy';
	
	static isMediaBlocker(policy){
		return this.#regex_mediaBlocker.test(policy);
	}
	
	static normalize(policy){
		return policy
			.replace(/\s*;\s*/g,';')
			.replace(/\b(script-src\s+'none'.*?;)(?:script-src-\w+\s+'none';)+/,'$1');
	}

	static isEmbedType(type){
		return /\b(?:application|video|audio)\b/.test(type) && 
			!/^application\/(?:(?:xhtml\+)?xml|javascript)$/.test(type);
	}
	
	static patchDataURI(uri,blocker){
		
		const parts = /^data:(?:[^,;]*ml|unknown-content-type)(;[^,]*)?,/i.exec(uri);
		
		// not an interesting data: URI, return as it is
		
		if(!blocker)
			return uri;
			
		if(!parts)
			return uri;
		
		// extra encoding info, let's bailout (better safe than sorry)
		
		if(parts[1])
			return 'data:';
		
		// It's a HTML/XML page, let's prepend our CSP blocker to the document
		
		const metaTag = `<meta http-equiv = '${ CSP.headerName }' content = "${ blocker }"/>`;
		
		const patch = parts[0] + encodeURIComponent(metaTag);
		
		if(uri.startsWith(patch))
			return uri;
			
		return patch + uri.substring(parts[0].length)
	}
	
	build(...directives){
		return directives.join(';');
	}
	
	buildBlocker(...types){
		
		function toDirective(t){
		
			const { name , type = t , value = `'none'` } = t;
			
			name ??= `${ type }-src`;
			
			return `${ name } ${ value }`;
		}
		
		const directives = types
			.map(toDirective)
		
		return this.build(...directives);
	}
	
	blocks(header,type){
		return header.includes(`${ type }-src 'none'`);
	}
	
	asHeader(value){
		const { headerName : name } = CSP;
		return { name , value };
	}
}
