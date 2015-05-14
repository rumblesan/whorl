
%lex

/* lexical grammar */

letter                [a-zA-Z]
digit                 [0-9]
string_quote          '"'
quote                 "'"
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

var Ast = require('../app/ast');
 
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
    : t_oparen t_let Variable Expression t_cparen
        { $$ = Ast.LetDefinition($3, $4); }
    ;

FunctionDefinition
    : t_oparen t_def t_oparen Variable Variable* t_cparen Body t_cparen
        { $$ = Ast.FunctionDefinition($4, $5, $7); }
    ;

Body
    : Definition* Expression+
        { $$ = Ast.Body($1, $2); }
    ;

/* Expressions */
Expression
    : Literal
    | Variable
        { $$ = Ast.Variable($1); }
    | t_oparen t_lambda LambdaArgNames Body t_cparen
        { $$ = Ast.Lambda($3, $4); }
    | t_oparen t_if Expression Expression t_cparen
        { $$ = Ast.If($3, $4); }
    | t_oparen t_if Expression Expression Expression t_cparen
        { $$ = Ast.IfElse($3, $4, $5); }
    | Application
    ;

LambdaArgNames
    : Variable
        { $$ = [$2]; }
    | t_oparen Variable* t_cparen
        { $$ = $2; }
    ;

Application
    : t_oparen Expression Expression* t_cparen
        { $$ = Ast.Application($2, $3); }
    ;

/* Variables */
Variable
    : t_id
        { $$ = yytext; }
    ;

/* Literals */
Literal
    : Boolean
    | Number
    | String
    | Symbol
    | List
    | Note
    | Beat
    ;

Boolean
    : t_true
        { $$ = Ast.Bool(true); }
    | t_false
        { $$ = Ast.Bool(false); }
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
        { $$ = Ast.Symbol(yytext.slice(1)); }
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
    : t_oparen t_list Datum* t_cparen
        { $$ = Ast.List($3); }
    | t_obracket Datum* t_cbracket
        { $$ = Ast.List($3); }
    ;

Map
    : t_oparen t_map MapPair* t_cparen
        { $$ = Ast.Map($3); }
    ;

MapPair
    : t_oparen Symbol Expression t_cparen
        { $$ = Ast.MapPair($2, $3); }
    ;

%%

