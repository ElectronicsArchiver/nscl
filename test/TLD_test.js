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


Test.registerSuite(async () => {
	const { headline , run } = Test;
	const { max } = Math;
	
	
	function toASCII(string){
		return punycode.toASCII(string ?? '');
	}
	
	
	function fixDomain(domain){
		
		if(domain.startsWith('.'))
		 	return '';
			
		if(tld.getPublicSuffix(domain) === domain)
			return '';
			
		return tld.getDomain(domain);
	}
	
	
	function formatResult(given,actual){
		
		given = `${ given }`
		actual = `${ actual }`;
		
		const length = max(given.length,actual.length);
		
		return `\n\t\t\t\t${ given.padStart(length,' ') }\n\t\t\t↳\t${ actual.padStart(length,' ') }`;
	}
	
	
	// see https://publicsuffix.org/list/ TEST DATA
	
	function checkPublicSuffix([ given , actual ]){
		
		const 
			raw = toASCII(given),
			resolved = toASCII(actual);
		
		const fixed = fixDomain(raw)
			.toLowerCase();
			
		const info = formatResult(given,actual);
		
		run(() => fixed == resolved,info);
	}
	
	
	const domains = [
		
		// Null Input
		
		[ null , null ] ,
		
		// Mixed Case
		
		[ 'COM' , null ] ,
		[ 'example.COM' , 'example.com' ] ,
		[ 'WwW.example.COM' , 'example.com' ] ,
		
		// Leading Dot
		
		[ '.com' , null ] ,
		[ '.example' , null ] ,
		[ '.example.com' , null ] ,
		[ '.example.example' , null ] ,
		
		// Unlisted TLD
		
		[ 'example' , null ] ,
		[ 'example.example' , 'example.example' ] ,
		[ 'b.example.example' , 'example.example' ] ,
		[ 'a.b.example.example' , 'example.example' ] ,
		
		// TLD with only 1 rule
		
		[ 'biz' , null ] ,
		[ 'domain.biz' , 'domain.biz' ] ,
		[ 'b.domain.biz' , 'domain.biz' ] ,
		[ 'a.b.domain.biz' , 'domain.biz' ] ,
		
		// TLD with some 2 level rules
		
		[ 'com' , null ] ,
		[ 'example.com' , 'example.com' ] ,
		[ 'b.example.com' , 'example.com' ] ,
		[ 'a.b.example.com' , 'example.com' ] ,
		[ 'uk.com' , null ] ,
		[ 'example.uk.com' , 'example.uk.com' ] ,
		[ 'b.example.uk.com' , 'example.uk.com' ] ,
		[ 'a.b.example.uk.com' , 'example.uk.com' ] ,
		[ 'test.ac' , 'test.ac' ] ,
		
		// TLD with only 1 wildcard rule
		
		[ 'mm' , null ] ,
		[ 'c.mm' , null ] ,
		[ 'b.c.mm' , 'b.c.mm' ] ,
		[ 'a.b.c.mm' , 'b.c.mm' ] ,
		
		// More Complex TLD
		
		[ 'jp' , null ] ,
		[ 'test.jp' , 'test.jp' ] ,
		[ 'www.test.jp' , 'test.jp' ] ,
		[ 'ac.jp' , null ] ,
		[ 'test.ac.jp' , 'test.ac.jp' ] ,
		[ 'www.test.ac.jp' , 'test.ac.jp' ] ,
		[ 'kyoto.jp' , null ] ,
		[ 'test.kyoto.jp' , 'test.kyoto.jp' ] ,
		[ 'ide.kyoto.jp' , null ] ,
		[ 'b.ide.kyoto.jp' , 'b.ide.kyoto.jp' ] ,
		[ 'a.b.ide.kyoto.jp' , 'b.ide.kyoto.jp' ] ,
		[ 'c.kobe.jp' , null ] ,
		[ 'b.c.kobe.jp' , 'b.c.kobe.jp' ] ,
		[ 'a.b.c.kobe.jp' , 'b.c.kobe.jp' ] ,
		[ 'city.kobe.jp' , 'city.kobe.jp' ] ,
		[ 'www.city.kobe.jp' , 'city.kobe.jp' ] ,
		
		// TLD with a wildcard rule and exeptions
		
		[ 'ck' , null ] ,
		[ 'test.ck' , null ] ,
		[ 'b.test.ck' , 'b.test.ck' ] ,
		[ 'a.b.test.ck' , 'b.test.ck' ] ,
		[ 'www.ck' , 'www.ck' ] ,
		[ 'www.www.ck' , 'www.ck' ] ,
		
		// US K12
		
		[ 'us' , null ] ,
		[ 'test.us' , 'test.us' ] ,
		[ 'www.test.us' , 'test.us' ] ,
		[ 'ak.us' , null ] ,
		[ 'test.ak.us' , 'test.ak.us' ] ,
		[ 'www.test.ak.us' , 'test.ak.us' ] ,
		[ 'k12.ak.us' , null ] ,
		[ 'test.k12.ak.us' , 'test.k12.ak.us' ] ,
		[ 'www.test.k12.ak.us' , 'test.k12.ak.us' ] ,
		
		// IDN Labels
		
		[ '食狮.com.cn' , '食狮.com.cn' ] ,
		[ '食狮.公司.cn' , '食狮.公司.cn' ] ,
		[ 'www.食狮.公司.cn' , '食狮.公司.cn' ] ,
		[ 'shishi.公司.cn' , 'shishi.公司.cn' ] ,
		[ '公司.cn' , null ] ,
		[ '食狮.中国' , '食狮.中国' ] ,
		[ 'www.食狮.中国' , '食狮.中国' ] ,
		[ 'shishi.中国' , 'shishi.中国' ] ,
		[ '中国' , null ] ,
		
		// Same as above, but punycode
		
		[ 'xn--85x722f.com.cn' , 'xn--85x722f.com.cn' ] ,
		[ 'xn--85x722f.xn--55qx5d.cn' , 'xn--85x722f.xn--55qx5d.cn' ] ,
		[ 'www.xn--85x722f.xn--55qx5d.cn' , 'xn--85x722f.xn--55qx5d.cn' ] ,
		[ 'shishi.xn--55qx5d.cn' , 'shishi.xn--55qx5d.cn' ] ,
		[ 'xn--55qx5d.cn' , null ] ,
		[ 'xn--85x722f.xn--fiqs8s' , 'xn--85x722f.xn--fiqs8s' ] ,
		[ 'www.xn--85x722f.xn--fiqs8s' , 'xn--85x722f.xn--fiqs8s' ] ,
		[ 'shishi.xn--fiqs8s' , 'shishi.xn--fiqs8s' ] ,
		[ 'xn--fiqs8s' , null ] 
	];
	
	
	headline('Public Suffix Tests');
	
	for(const testCase of domains)
		checkPublicSuffix(testCase);
});
