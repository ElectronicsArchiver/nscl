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
	
	const toStyle = (...attributes) =>
		attributes.join(';');
	
	
	const style_default = toStyle(
		'color : inherit' ,
	);
	
	const style_none = toStyle(
		'color : #ce8ce9' ,
		'font-weight : bold' ,
		'border-radius : 2px' ,
	);
	
	const style_code = toStyle(
		'color : #fff' ,
		'background-color : #343333' ,
		'border-radius : 2px'
	);
	
	const style_passed = toStyle(
		'color : green' ,
		'font-weight : bold' ,
		'border-radius : 2px'
	);
	
	const style_failed = toStyle(
		'color : red' ,
		'font-weight : bold' ,
		'border-radius : 2px'
	);
	
	
	const { log } = console;
	
	let
		passed = 0 ,
		failed = 0 ;
	
	
	function resolvePath(path){
		
		if(!path.startsWith('/'))
			path = `/test/${ path }`;
		
		if(!path.endsWith('_test.js'))
			path += '_test.js';
			
		return path;
	}
	
	async function includeTest(tests = []){
		
		for(let test of tests){
			
			log(`Testing ${ test }`);
			
			passed = failed = 0;

			const path = resolvePath(test);
			
			try { await include(path); }
			catch ( error ) {
				
				/*
				 *	We might omit some tests in publicly 
				 *	available code for Security reasons, 
				 *	e.g. embargoing new XSS vectors.
				 */

				log('Skipping Test',test,error);
			}
		}
	}
	
	
	async function run(test,message = test,callback){
		
		let success = false;
		
		try { success = await test(); }
		catch(e) { error(e); }
		
		if(success){
			passed++;
			log(`%cPASSED  %c${ test }`,style_passed,style_code);
		} else {
			log(`%cFAILED  %c${ test }`,style_failed,style_code);
		}
		
		if(callback)
			try { await callback(success,test,message); }
			catch (e) { error(e,'[TEST CALLBACK]'); }
		
		return success;
	}
	
	
	function report(){
		
		const count = passed + failed;
		
		if(count == 0)
			return noneConducted();
		
		if(failed == 0)
			return failedAll(count);
		
		if(passed == 0)
			return passedAll(count);
		
		failedSome(failed,count);
	}
	
	
	function noneConducted(){
		log(`%c\nNo Tests Have Been Conducted\n`,
			style_none);
	}
	
	function failedAll(count){
		log(`\nAll %c${ count } %cTests Have %cPassed\n`,
			style_passed,style_default,style_passed);
	}
	
	function passedAll(count){
		log(`\nAll %c${ count } %cTests Have %cFailed\n`,
			style_failed,style_default,style_failed);
	}
	
	function failedSome(failed,count){
		log(`%\nc${ failed } %c/ ${ count } Tests Have %cFailed\n`,
			style_failed,style_default,style_failed);
	}
	
	
	self.Test = {
		include : includeTest ,
		report , run 
	};
}
