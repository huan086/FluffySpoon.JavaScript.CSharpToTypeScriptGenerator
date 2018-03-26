﻿import { FileParser, CSharpClass, CSharpStruct } from 'fluffy-spoon.javascript.csharp-parser';

import { StringEmitter } from './StringEmitter';
import { EnumEmitter, EnumEmitOptions } from './EnumEmitter';
import { TypeEmitter, TypeEmitOptions } from './TypeEmitter';
import { PropertyEmitter, PropertyEmitOptions } from './PropertyEmitter';
import { FieldEmitter, FieldEmitOptions } from './FieldEmitter';
import { MethodEmitter, MethodEmitOptions } from './MethodEmitter';
import { Logger } from './Logger';

import ts = require("typescript");
import { OptionsHelper } from './OptionsHelper';

export interface StructEmitOptionsBase {
	declare?: boolean;
	filter?: (struct: CSharpStruct) => boolean;
	perStructEmitOptions?: (struct: CSharpStruct) => PerStructEmitOptions;
}

export interface StructEmitOptionsLinks {
	propertyEmitOptions?: PropertyEmitOptions;
	methodEmitOptions?: MethodEmitOptions;
	fieldEmitOptions?: FieldEmitOptions;
}

export interface StructEmitOptions extends StructEmitOptionsBase, StructEmitOptionsLinks {
}

export interface PerStructEmitOptions extends StructEmitOptionsBase, StructEmitOptionsLinks {
	name?: string;
}

export class StructEmitter {
	private enumEmitter: EnumEmitter;
	private propertyEmitter: PropertyEmitter;
	private fieldEmitter: FieldEmitter;
	private methodEmitter: MethodEmitter;
	private typeEmitter: TypeEmitter;
	private optionsHelper: OptionsHelper;

	constructor(
		private stringEmitter: StringEmitter,
		private logger: Logger
	) {
		this.enumEmitter = new EnumEmitter(stringEmitter, logger);
		this.propertyEmitter = new PropertyEmitter(stringEmitter, logger);
		this.fieldEmitter = new FieldEmitter(stringEmitter, logger);
		this.methodEmitter = new MethodEmitter(stringEmitter, logger);
		this.typeEmitter = new TypeEmitter(stringEmitter, logger);
		this.optionsHelper = new OptionsHelper();
	}

	emitStructs(structs: CSharpStruct[], options: StructEmitOptions) {
		this.logger.log("Emitting structs", structs);

		for (var struct of structs) {
			this.emitStruct(struct, options);
		}

		this.logger.log("Done emitting structs", structs);
	}

	emitStruct(struct: CSharpStruct, options: StructEmitOptions) {
		this.logger.log("Emitting struct", struct);

		var node = this.createTypeScriptStructNode(struct, options);
		if(node)
			this.stringEmitter.emitTypeScriptNode(node);

		this.logger.log("Done emitting struct", struct);
	}

	createTypeScriptStructNode(struct: CSharpStruct, options: StructEmitOptions & PerStructEmitOptions) {
		options = this.optionsHelper.mergeOptionsRecursively<any>(
			options.perStructEmitOptions(struct), 
			options);

		if (struct.properties.length === 0 && struct.methods.length === 0 && struct.fields.length === 0) {
			this.logger.log("Skipping interface " + struct.name + " because it contains no properties, fields or methods");
			return null;
		}

		if(!options.filter(struct))
			return null;

		var structName = options.name || struct.name;
		this.logger.log("Emitting interface " + structName);
		
		var modifiers = new Array<ts.Modifier>();
		if (options.declare)
			modifiers.push(ts.createToken(ts.SyntaxKind.DeclareKeyword));

		var fields = struct
			.fields
			.map(p => this
				.fieldEmitter
				.createTypeScriptFieldNode(p, options.fieldEmitOptions));

		var properties = struct
			.properties
			.map(p => this
				.propertyEmitter
				.createTypeScriptPropertyNode(p, options.propertyEmitOptions));

		var node = ts.createInterfaceDeclaration(
			[], 
			modifiers, 
			structName,
			[],
			[],
			[...properties, ...fields]);

		return node;
	}
}