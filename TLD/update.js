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


const 
	fileSystem = require('fs'),
	punycode = require('punycode'),
	https = require('https');
 
const { argv } = process;
const { log } = console;

const args = argv.slice(2);

const
	Cache = 'public_suffix_list.dat' ,
	Url = `https://publicsuffix.org/list/${ Cache }` ,
	Out = args[0] ?? '../common/tld.js' ;
	

const start = Date.now();


https.get(Url,(response) => {
	response.pipe(fileSystem.createWriteStream(Cache));
	response.on('end',() => {
		
		const delta = Date.now(); - start;
		
		log(`${ Url } retrieved in ${ delta }ms.`);
		parse();
	});
});



const
	regex_sections = /^\/\/\s*===BEGIN (ICANN|PRIVATE) DOMAINS===\s*$/ ,
	regex_splitter =  /(\!|\*\.)?(.+)/ ,
	regex_comment = /^\/\/.*?/ ;

const { stringify } = JSON;

function parse(){
	
	let section;
	
	const tlds = {};
	
	
	const lines = fileSystem
		.readFileSync(Cache,'utf8')
		.split(/[\r\n]/)
		.map((line) => line.trim());
	
	
	for(const line of lines){
		
		if(regex_sections.test(line)){
			
			section = regex_sections
				.exec(line)[1]
				.toLowerCase();
				
			tlds[section] = {};
				
			continue;
		}
		
		if(!section)
		 	continue;
			
		if(regex_comment.test(line))
			continue;
			
		if(!regex_splitter.test(line))
  			continue;
			
		const [ _ , modifier , tld ] = regex_splitter.exec(line);
		const ascii = punycode.toASCII(tld);
		
		let { level } = ascii.split('.');
		
		switch(modifier){
		case '*.':
			level++;
			break;
		case '!':
			level--;
			break;
		}
			
		tlds[section][ascii] = level;
	}
	
	
	if(!tlds.icann)
		throw `Error in TLD parser`;
		
	if(!tlds.private)
		throw `Error in TLD parser`;
	
	fileSystem.unlinkSync(Cache);
	
	let out = fileSystem.readFileSync(Out,'utf8');
	let exitCode = 1;
	
	const json = stringify(tlds);

	if(out.includes(json)){
		
		out = json;
		
		if(!/^s*\{/.test(out))
			out = out.replace(/(\btlds = )\{[^]*?\};/,`$1${ json };`);
	    
		fileSystem.writeFileSync(Out,out);
	    
		log(`${ Out } updated!`);
	    
		exitCode = 0;
		
	} else {
		log(`${ Out } was already up-to-date.`);
	}
	
	const delta = Date.now() - start;
	
	log(`TLDs update finished in ${ delta }ms`);
	
	process.exit(exitCode);
}
