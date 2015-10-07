
%lex

/* lexical grammar */

letter                [a-zA-Z]
digit                 [0-9]
string_quote          '"'
quote                 "'"
type_def              "::"
colon                 ":"
symchar               [!$%&*/<=>?~_^]
specchar              [\.\+\-:']

initial               {letter}|{symchar}
subsequent            {initial}|{digit}|{specchar}
number                (\-)?{digit}+("."{digit}+)?
identifier            ({initial}{subsequent}*)|[\+\-]

note                  {quote}[A-G]([#b])?[0-9]+
beat                  {quote}{digit}+("."{digit}+)?

strchars              ({letter}|{digit}|{symchar}|{specchar})*

%%

/* comments */
";".*\n               /* skip comments */
";".*<<EOF>>          /* skip comments */

/* brackets */
"("                   return "t_oparen"
")"                   return "t_cparen"
"["                   return "t_obracket"
"]"                   return "t_cbracket"

/* booleans */
"#t"                  return "t_true"
"#f"                  return "t_false"

{note}                return "t_note"
{beat}                return "t_beat"

/* syntax bits */
"let"                 return "t_let"
"def"                 return "t_def"
"lambda"              return "t_lambda"
"if"                  return "t_if"
"list"                return "t_list"
"map"                 return "t_map"

{type_def}            return "t_typedef"
{colon}{identifier}   return "t_symbol"
{number}              return "t_number"
{identifier}          return "t_id"

{string_quote}{strchars}{string_quote} yytext = yytext.substr(1,yyleng-2); return "t_string"

/* misc */
<<EOF>>               return "t_eof"
\s+                   /* skip whitespace */
.                     return "INVALID"

/lex

%{

var Ast     = require('../app/language/ast');
var TypeAst = require('../app/language/typeAst');

%}

%start Program

%ebnf

%% /* language grammar */

Program
    : Form* t_eof
        { return $1; }
    ;

Form
    : Definition
    | Expression
    ;

/* Definitions */
Definition
    : LetDefinition
    | FunctionDefinition
    ;

LetDefinition
    : t_oparen t_let Identifier Expression t_cparen
        { $$ = Ast.LetDefinition($3, $4); }
    ;

FunctionDefinition
    : t_oparen t_def TypedIdentifier t_oparen TypedIdentifier* t_cparen Body t_cparen
        %{
            var funcName = $3.name;
            var returnType = $3.type;
            var argNames = $5.map(function (arg) {
                return arg.name;
            });
            var argTypes = $5.map(function (arg) {
                return arg.type;
            });
            $$ = Ast.FunctionDefinition(
                funcName,
                returnType,
                argNames,
                argTypes,
                $7
            );
        }%
    ;

Body
    : Definition* Expression+
        { $$ = Ast.Body($1, $2); }
    ;

/* Expressions */
Expression
    : Lambda
    | If
    | Application
    | Variable
    | Literal
    ;

Lambda
    : t_oparen t_lambda LambdaArgNames Body t_cparen
        %{
            var argNames = $3.map(function (arg) {
                return arg.name;
            });
            var argTypes = $3.map(function (arg) {
                return arg.type;
            });
            $$ = Ast.Lambda($3, $4);
        }%
    ;

LambdaArgNames
    : TypedIdentifier
        { $$ = [$2]; }
    | t_oparen TypedIdentifier* t_cparen
        { $$ = $2; }
    ;

If
    : t_oparen t_if Expression Expression t_cparen
        { $$ = Ast.If($3, $4); }
    | t_oparen t_if Expression Expression Expression t_cparen
        { $$ = Ast.IfElse($3, $4, $5); }
    ;

Application
    : t_oparen Expression Expression* t_cparen
        { $$ = Ast.Application($2, $3); }
    ;

Variable
    : Identifier
        { $$ = Ast.Variable($1); }
    ;

Identifier
    : t_id
        { $$ = yytext; }
    ;

TypedIdentifier
    : Identifier TypeDef?
        %{
            var t
            if ($2 === undefined) {
                t = TypeAst.UndefinedType();
            } else {
                t = $2;
            }
            $$ = Ast.TypedIdentifier($1, t);
        }%
    ;

/* Types */

TypeDef
    : t_typedef TypeName
        { $$ = $2; }
    ;

TypeName
    : Identifier
        { $$ = TypeAst.SimpleType($1); }
    | "List" t_oparen TypeName t_cparen
        { $$ = TypeAst.ListType($3); }
    | "Map" t_oparen TypeName TypeName t_cparen
        { $$ = TypeAst.MapType($3, $4); }
    ;

/* Literals */
Literal
    : Boolean
    | Undefined
    | Number
    | String
    | Symbol
    | Note
    | Beat
    | List
    | Map
    ;

Boolean
    : t_true
        { $$ = Ast.Bool(true); }
    | t_false
        { $$ = Ast.Bool(false); }
    ;

Undefined
    : t_undefined
        { $$ = Ast.Undefined(); }
    ;

Number
    : t_number
        { $$ = Ast.Num(Number(yytext)); }
    ;

String
    : t_string
        { $$ = Ast.Str(yytext); }
    ;

Symbol
    : t_symbol
        { $$ = Ast.Symb(yytext.slice(1)); }
    ;

Note
    : t_note
        {
            var data = /([a-gA-G][#b]?)([0-9]+)/.exec(yytext);
            $$ = Ast.Note(data[1], data[2]);
        }
    ;

Beat
    : t_beat
        {
            var data = /[0-9]+("."[0-9]+)/.exec(yytext);
            $$ = Ast.Beat(data[1]);
        }
    ;

List
    : t_oparen t_list Expression* t_cparen
        { $$ = Ast.List($3); }
    ;

// TODO
// Define this correctly
Map
    : t_oparen t_map MapPair* t_cparen
        { $$ = Ast.Map($3); }
    ;

MapPair
    : t_oparen Symbol Expression t_cparen
        { $$ = Ast.MapPair($2, $3); }
    ;

%%

