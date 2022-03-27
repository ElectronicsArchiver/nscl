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


'use strict';


function CapsCSP(base = new CSP){
	
	function buildFromCapabilities(capabilities,blockHttp = false){
		
		const { dataUriTypes , types } = this;
		
		let blocked = types.filter((type) => ! capabilities.has(type));
		
		blocked = new Set(blocked);

		if(!capabilities.has('script')){
			
			blocked.add({ name : 'script-src-elem' });
			blocked.add({ name : 'script-src-attr' });
			blocked.add('worker');


			// data: URIs loaded in objects may run scripts

			if(!blocked.has('object'))
				blocked.add({ type : 'object' , value : 'http:' });
		}
		
		/*
		 *	HTTP is blocked in onBeforeRequest
		 *	let's allow it only and block for
		 *	instance data: and blob: URIs
		 */
		
		if(!blockHttp)
			dataUriTypes
			.filter((type) => blocked.delete(type))
			.forEach((type) => blocked.add({ type , value : 'http:' }));
			
		if(blocked.size)
			return this.buildBlocker(...blocked);
		
		return null;
	}
	
	return {
		...base ,
		types : [ 'script' , 'object' , 'media' , 'font' ] ,
		dataUriTypes : [ 'font' , 'media' , 'object' ] ,
		buildFromCapabilities	
	};
}
