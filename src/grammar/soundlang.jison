
%lex

/* lexical grammar */

letter                [a-zA-Z]
digit                 [0-9]
dquote                '"'
squote                "'"
symchar               [!$%&*/:<=>?~_^]
specchar              [\.\+\-]

initial               {letter}|{symchar}
subsequent            {initial}|{digit}|{specchar}
number                (\-)?{digit}+("."{digit}+)?
identifier            ({initial}{subsequent}*)|[\+\-]

strchars              ({letter}|{digit}|{symchar}|{specchar})*

%%

/* comments */
";".*\n               /* skip comments */
";".*<<EOF>>          /* skip comments */

/* brackets */
"("                   return "t_oparen"
")"                   return "t_cparen"

/* syntax bits */
"define"              return "t_define"
"lambda"              return "t_lambda"
"if"                  return "t_if"
"."                   return "t_dot"
"list"                return "t_list"

{number}              return "t_number"
{identifier}          return "t_id"

{dquote}{strchars}{dquote} yytext = yytext.substr(1,yyleng-2); return "t_string"

/* booleans */
"#t"                  return "t_true"
"#f"                  return "t_false"
/* misc */
<<EOF>>               return "t_eof"
\s+                   /* skip whitespace */
.                     return "INVALID"


/lex

%{

var Ast = require('./app/ast');
 
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
    : VariableDefinition
    ;

VariableDefinition
    : t_oparen t_define Variable Expression t_cparen
        { $$ = Ast.Define($3, $4); }
    | t_oparen t_define t_oparen Variable Variable* t_cparen Body t_cparen
        { $$ = Ast.DefineFunction($4, $5, $7); }
    ;

Variable
    : Identifier
    ;

Body
    : Definition* Expression+
        { $$ = Ast.Body($1, $2); }
    ;

/* Expressions */
Expression
    : Constant
    | Variable
        { $$ = Ast.Variable($1); }
    | t_oparen t_lambda Formals Body t_cparen
        { $$ = Ast.Lambda($3, $4); }
    | t_oparen t_if Expression Expression t_cparen
        { $$ = Ast.If($3, $4); }
    | t_oparen t_if Expression Expression Expression t_cparen
        { $$ = Ast.IfElse($3, $4, $5); }
    | Application
    ;

Constant
    : Boolean
    | Number
    | Character
    | String
    | List
    ;

Formals
    : Variable
        { $$ = [$2]; }
    | t_oparen Variable* t_cparen
        { $$ = $2; }
    ;

Application
    : t_oparen Expression Expression* t_cparen
        { $$ = Ast.Application($2, $3); }
    ;

/* Identifiers */
Identifier
    : t_id
        { $$ = yytext; }
    ;

/* Data */

Datum
    : Boolean
    | Number
    | Character
    | String
    | Symbol
    | List
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

Character
    : "#\\" letter
        { $$ = Ast.Character(yytext); }
    | "#\\" symchar
        { $$ = Ast.Character(yytext); }
    | "#\\" digit
        { $$ = Ast.Character(yytext); }
    | "#\\newline"
        { $$ = Ast.Character(yytext); }
    | "#\\space"
        { $$ = Ast.Character(yytext); }
    ;

String
    : t_string
        { $$ = Ast.Str(yytext); }
    ;

Symbol
    : Identifier
        { $$ = Ast.Symbol($1); }
    ;

List
    : t_oparen t_list Datum* t_cparen
        { $$ = Ast.List($3); }
    ;

%%

