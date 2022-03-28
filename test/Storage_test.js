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


Test.registerSuite(async () => {
	
	const { stringify } = JSON;
	
	const
		Huge = 16000 ,
		Big = 1000 ;
	
	
	function * hex(amount){
		
		let count = 0;
		
		while(count < amount){
			yield count.toString(16);
			count++;
		}
	}
	
	function * hexIds(amount){
		for(const number of hex(amount))
			yield number.padStart(4,'0');
	}
	
	function createObject(propCount){
		
		const object = {};
		
		for(const hex of hexIds(propCount))
			object[`k${ hex }`] = `v${ hex }`;
	
		const { length } = stringify(object);
	
		log(`\t>>\t Created object with ${ length } JSON characters.`);
		
		return object;
	}
		
	
	const { hasLocalFallback , isChunked , remove , get , set } = Storage;
	
	
	async function compare(key,property,value){
		
		const 
			data = await get('sync',key) ,
			current = data[key] ;
		
		if(current[property] === value)
			return true;
		
		log(`\t>>\t sync.${ key }.${ property } != ${ value }\n\t\t\tData: %o`,current);
		
		return false;
	}
	
	async function fallbackOrChunked(key){
		
		const 
			fallback = await hasLocalFallback(key),
			chunked = await isChunked(key);
		
		const result = fallback
			? ! chunked
			:   chunked ;
		
		if(result)
			return true;
		
		log(`\t>>\tKey: %o\n\t\tFallback: %o\n\t\tChunked: %o`,key,fallback,chunked);
		
		return false;
	}
	
	async function checkSize(key,size){
		
		const 
			data = await get('sync',key),
			value = data[key];
		
		const { length } = Object.keys(value);
		
		if(length === size)
			return true;
			
		log(`\t>>\tMeasured: %o\n\t\tWanted: %o`,length,size);
	}


	const { headline , report , run } = Test;

	
	headline('Storage Tests');
	
	
	const
		huge = createObject(Huge) ,
		big = createObject(Big) ;

	const items = {
		big,
		small1 : {
			x : 1 ,
			y : 2
		},
		small2 : {
			k : 3 ,
			j : 4
		}
	};
	
	const keys = Object.keys(items);
	keys.push('huge');
	
	let everything;
	
	
	await run(async () => {
		
		await set('sync',items);
		await set('sync',{ huge });
		
		everything = await get('sync',keys);
		
		const { sync , local } = browser.storage;
		
		const
			localData = await local.get() ,
			syncData = await sync.get() ;
		
		const { length } = Object.keys(everything);
		
		if(length === keys.length)
			return true;
		
		const info = [
			`\t>>\t Storage` ,
			`\t  \t -------` ,
			'\n' ,
			`\t\t\tSync:` ,
			'\n' ,
			`\t\t\t\t%o` ,
			'\n' ,
			`\t\t\tLocal:` ,
			'\n' ,
			`\t\t\t\t%o` ,
			'\n' ,
			`\t\t\tFiltered:` ,
			'\n' ,
			`\t\t\t\t%o` ,
			'\n' ,
			`\t\t\tEverything:` ,
			'\n' ,
			`\t\t\t\t%o` ,
			'\n'
		];
		
		log(info.join('\n'),syncData,localData,keys,everything);
		
		return false;
	},`All stored objects are still present.`);
	
	
	await run(async () => await checkSize('big',Big),
		`The big object retained its original size.`);
	
	await run(async () => await checkSize('huge',Huge),
		`The huge object retained its original size.`);
	
	await run(async () => await fallbackOrChunked('big'),
		`The big object has a fallback or is chunked.`);
	
	await run(async () => await fallbackOrChunked('huge'),
		`The huge object has a fallback or is chunked.`);
	
	await run(async () => await compare('small1','y',2),
		`The small1 object still contains the stored key-value pair.`);
		
	await run(async () => await compare('small2','k',3),
		`The small2 object still contains the stored key-value pair.`);

	await run(async () => await compare('big','k0000','v0000'),
		`The first element in the big object is still present`);
		
	await run(async () => await compare('huge','k0001','v0001'),
		`The second element in the huge object is still present`);
		
	await run(async () => {
		
		const key = 'big';
		
		let wasChunked = await isChunked(key);
		
		await set('sync',{
			[ key ] : {
				tiny : 'prop'
			}
		});
		
		if(!wasChunked)
			return false;
			
		return ! await isChunked(key);
	},`The big object was chunked but isn't after being replaced with a tiny value.`);
	
	
	await run(async () => compare('big','tiny','prop'),
		`The big object still retains the correct tiny value`);
		
	await run(async () => {
		
		await remove('sync',keys);
		
		const items = await get('sync',keys);
		
		const { length } = Object.keys(items);
		
		return length === 0;
	},`The storage can be completely cleaned.`);
	
});
