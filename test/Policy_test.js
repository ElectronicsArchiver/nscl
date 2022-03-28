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
	
	
	headline('Policy Tests');
	
	
	{
		const { stringify } = JSON;
		
		const original = new Policy;
		original.set('noscript.net',new Permissions([ 'script' ],true));
		original.set('https://noscript.net',new Permissions([ 'script' , 'object' ]));
		original.set('maone.net',original.TRUSTED.tempTwin);
		original.set(Sites.secureDomainKey('secure.informaction.com'),original.TRUSTED);
		original.set('https://flashgot.net',original.TRUSTED);
		original.set('http://flashgot.net',original.UNTRUSTED);
		original.set('perchè.com',original.TRUSTED);
		original.set('10', original.TRUSTED);
		original.set('192.168',original.TRUSTED);
		original.set('192.168.69',original.UNTRUSTED);
		
		const copy = new Policy(original.dry());
		
		
		run(() => stringify(original.dry()) === stringify(copy.dry()),
			`The static content of a copied policy is the same as the originals.`);
			
		run(() => original.snapshot !== copy.snapshot,
			`The dynamic content of a statically copied policy is not the same as the originals`);
			
		
		run(() => copy.can('https://noscript.net'),
			`A temporarily trusted secure website with script permissions can be accessed.`);
			
		run(() => ! copy.can('http://noscript.net'),
			`A temporarily trusted secure website cannot be used to access it's insecure counterpart.`);
			
		run(() => copy.can('https://noscript.net','object'),
			`A temporarily trusted website with script permissions cannot use objects.`);
	}
	
	
	{
		const policy = new Policy;
		policy.set('perchè.com',policy.TRUSTED);
		
		run(() => policy.can('http://perchè.com/test'),
			`A trusted, unsecure, IDN encoded, page can be accessed.`);
	}
	
	{
		const { toExternal } = Sites;
		
		const url = 'https://perché.com/test';
		const external = toExternal(new URL(url));
		
		run(() => external === url,
			`The content of a IDN encoded, then decoded url stays the same.`);
	}
	
	{
		// SecureDomainKey should be "downgraded" by UNTRUSTED, issue #126
		
		const 
			page = 'evil.com',
			http = `http://${ page }`,
			secure = Sites.secureDomainKey('evil.com');
		
		const policy = new Policy;
		policy.set(secure,policy.UNTRUSTED);
		
		run(() => ! policy.can(http),
			`Untrusting a secure page will also unstrust it's insecure counterpart`);
	}
	
	{
		// Treating Tor onion URLs like HTTPS
		
		const secureOnion = Sites.onionSecure;
		
		
		Sites.onionSecure = true;
		
		const url = 'http://some.onion';
		
		const policy = new Policy;
		policy.set(url,policy.TRUSTED);
		
		run(() => policy.can(url),
			`Onion urls are treated like https urls.`);
		
		
		Sites.onionSecure = secureOnion;
	}
	
	{
		const 
			page = 'secure.informaction.com',
			secure = Sites.secureDomainKey(page);

		const 
			https = `https://${ page }` ,
			http = `http://${ page }` ,
			www = `https://www.${ page }`;
		
		const policy = new Policy;
		policy.set(secure,policy.TRUSTED);
		
		
		run(() => ! policy.can(http),
			`A trusted secure pages insecure counterpart cannot be accessed.`);
			
		run(() => policy.can(https),
			`A trusted secure page can be accessed.`);
			
		run(() => policy.can(www),
			`A trusted secure page can be accessed on it's 'www' subdomain.`);
	}
	
	{
		// Contextual Policies
	
		const optimal = Sites.optimalKey('https://facebook.com');
		
		const policy = new Policy;
		const trusted = new Sites([[ optimal , policy.TRUSTED ]]);	
		policy.set('facebook.net',new Permissions([],false,trusted));

		run(() => ! policy.can('https://facebook.net'),
			`A trusted insecure page cannot be accessed from it's secure counterpart.`);
		
		run(() => policy.can('https://facebook.net','script','https://www.facebook.com'),
			`On a trusted secure page, script resource from the same page can be accessed.`);
		
		run(() => ! policy.can('https://facebook.net','script','http://facebook.com'),
			`On the insecure counterpart of a trusted secure page, script resources from the secure site cannot be accessed.`);
	}
	
	{
		const policy = new Policy;
		policy.set('10',policy.TRUSTED);
		policy.set('192.168',policy.TRUSTED);
		policy.set('192.168.69',policy.UNTRUSTED);
		
		run(() => ! policy.can('https://10.0.0.1'),
			`Trusting an incomplete Ip with only it's first part does not succeed.`);
			
		run(() => ! policy.can('https://192.168.69.1'),
			`Not trusting an incomplete Ip with it's first three parts succeeds.`);
			
		run(() => policy.can('http://192.168.1.2'),
			`Trusting an incomplete Ip with only it's first two parts succeeds.`);
	}
});
