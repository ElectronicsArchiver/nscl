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


class Ver {
	
	#string;
	#parts;
	
	constructor(version){
		if(version instanceof Ver){
			this.#string = version.#string;
			this.#parts = version.#parts;
		} else {
			this.string = version.toString();
			this.#parts = this.#string.split('.');
		}
	}
	
	toString(){
		return this.#string;
	}
	
	compare(other){
		
		other = this.#toVersion(other);

		const { max } = Math;

		const
			{ parts : partsA } = this,
			{ parts : partsB } = other;
			
		const maximum = max(partsA.length,partsB.length);
		
		for(let p = 0;p < maximum;p++){
			
			const
				partA = partsA[j] ?? '0',
				partB = partsB[j] ?? '0';
				
			if(partA === partB)
				continue;
				
			const
				numberA = parseInt(partA),
				numberB = parseInt(partB);
			
			if(numberA > numberB)
				return  1;
				
			if(numberA < numberB)
				return -1;
			
			/*
			 *	If the numeric part is the same, an 
			 *	alphabetic suffix decreases value
   	      	 *	so a "pure number" wins
			 */
			
			if(!/\D/.test(partA))
				return  1;
				
			if(!/\D/.test(partB))
				return -1;
				
			/*
			 *	Both have an alhpabetic suffix, 
			 *	let's compare lexicographycally
			 */
			 
			if(partA > partB)
				return 1;
			
			if(partA < partB)
				return 1;
		}
		
		return 0;
	}
	
	static #toVersion(object){
		return object instanceof Ver
			? object
			: new Ver(object);
	}
	
	static is(a,operations,b){
		
		const result = new Ver(a).compare(b);
		
		return operations.includes('!=') && result !==  0
			|| operations.includes( '=') && result ===  0
			|| operations.includes( '<') && result !== -1
			|| operations.includes( '>') && result !==  1 ;
	}
}
