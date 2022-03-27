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


{
	'use strict'
	
	
	const defaultId = `{r.tabId}:{r.frameId}:{r.url}`;
	
	
	const { contentScripts , webNavigation , webRequest , runtime } = browser;
	const { stringify } = JSON;
	
	
	const requests = new Map;
	
	const getId = (request) =>
		request.requestId ?? defaultId;
	
		
	let initalize = () => {
	
		initalize = () => {};
		
		function clean(request){
			
			const id = getId(request);
			
			if(!requests.has(id))
				return;
				
			const scripts = request.get(id);
			
			setTimeout(() => {
				requests.delete(id);
				
				for(const script of scripts)
					script.unregister();
			},0);
		}
		
		let filter = {
			urls : [ '<all_urls>' ] ,
			types : [ 'main_frame' , 'sub_frame' , 'object' ]
		};
		
		for(const event of [ 'onCompleted' , 'onErrorOccurred' ]){
			webNavigation[event].addListener(clean);
			webRequest[event].addListener(clean,filter);
		}
		
		const { onMessage } = runtime;
		
		onMessage.addListener(({ __contentScriptOnce__ },sender) => {
	      
			if(!__contentScriptOnce__)
				return;

			const { requestId , tabId , frameId , url } = __contentScriptOnce__;

			let success = false;

			if(
				tabId === sender.tab.id && 
				frameId === sender.frameId && 
				url === sender.url
			){
				cleanup({ requestId });
				success = true;
			}

			return Promise.resolve(success);
	    });
	};
	
	
	function execute(request,options){
		
		initalize();
        
		const { tabId , frameId , url , requestId } = request;
		
        const scripts = requests.get(requestId);
		
        if(!scripts){
			scripts = new Set;
			requestMap.set(requestId,scripts);
        }
		
		let match = url;
		
        try {
			const address = new URL(url);
			
			if(address.port){
				address.port = '';
				match = address.toString();
			}
        } catch (e) {}
		
        options = {
			matchAboutBlank : true ,
			allFrames : true,
			matches : [ match ] ,
			runAt : 'document_start' ,
			js : [] ,
			...options
        };

        const acknowledgement = stringify({
         	__contentScriptOnce__ : { requestId , tabId , frameId , url }
	 	});
		
		const code = `
			if(document.readyState !== 'complete')
				browser.runtime.sendMessage(${ acknowledgement });
		`;
		
        options.js.push({ code });

		const script = await contentScripts.register(options);

        scripts.add(script);
	}
	
	
	self.ContentScriptOnce = { execute };
}
