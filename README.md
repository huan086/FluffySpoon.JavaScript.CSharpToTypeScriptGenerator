# FluffySpoon.JavaScript.CSharpToTypeScriptGenerator

# Recipes
These recipes help you quickly get started with common scenarios you may need. Feel free to contribute with your own!

```typescript
import { FileEmitter } from 'fluffy-spoon.javascript.csharp-to-typescript-generator';

var csharpCode = "insert the CSharp model code here - you could also read it from a file.";
var emitter = new FileEmitter(csharpCode);
var options = <FileEmitOptions>{ };
var typescriptCode = emitter.emitFile(options);
```

## TypeScript
### Generating TypeScript DTO models from CSharp models

#### Default settings
```typescript
var typescriptCode = emitter.emitFile();
```

Given the following CSharp model code:

```csharp
namespace MyNamespace {
  public class MyClass {
    public int MyProperty { get; set; }
    public string MyOtherProperty { get; set; }
    public double? MyNullableProperty { get; set; }
    
    public class MySubclass {
      public List<string> MyListProperty { get; set; }
      public MyGenericType<SomeType, SomeOtherType> MyGenericProperty { get; set; }
      public Task MyFunction(string input1, int input2) { 
        //some code
      }
    }
  }
}
```

The following TypeScript code would be generated:

```typescript
declare namespace MyNamespace {
  interface MyClass {
    MyProperty: number;
    MyOtherProperty: string;
    MyNullableProperty?: number;
  }
  
  namespace MyClass {
    interface MySubclass {
      MyListProperty: string[];
      MyGenericProperty: MyGenericType<SomeType, SomeOtherType>;
      MyFunction(input1: string, input2: number): Promise;
    }
  }
}
```

#### Ignoring methods
```typescript
var typescriptCode = emitter.emitFile({
  methodEmitOptions: {
    filter: (method: CSharpMethod) => false //returning false filters away all methods
  }
});
```

Given the following CSharp model code:

```csharp
public class MyClass {
  public int MyProperty { get; set; }
  public Task MyFunction(string input1, int input2) { 
    //some code
  }
}
```

The following TypeScript code would be generated:

```typescript
declare interface MyClass {
  MyProperty: number;
}
```

#### Wrapping all emitted code in a namespace
```typescript
var typescriptCode = emitter.emitFile({
  methodEmitOptions: {
    afterParsing: (file: CSharpFile) => {
      //we create a namespace, move all items of the file into that namespace, and remove it from the file. 
      //we then add the newly created namespace to the file.
    
      var namespace = new CSharpNamespace("MyNamespace");
      namespace.classes = file.classes;
      namespace.enums = file.enums;
      namespace.innerScopeText = file.innerScopeText;
      namespace.interfaces = file.interfaces;
      namespace.namespaces = file.namespaces;
      namespace.parent = file;
      namespace.structs = file.structs;
      namespace.usings = file.usings;

      file.classes = [];
      file.enums = [];
      file.interfaces = [];
      file.namespaces = [];
      file.structs = [];
      file.usings = [];

      file.namespaces.push(namespace);
    }
  }
});
```

Given the following CSharp model code:

```csharp
public class MyClass {
}
```

The following TypeScript code would be generated:

```typescript
declare namespace MyNamespace {
  interface MyClass {
    MyProperty: number;
  }
}
```

## Angular
### Generating TypeScript AJAX clients for CSharp controllers
