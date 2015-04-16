
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
"begin"               return "t_begin"
"define"              return "t_define"
"lambda"              return "t_lambda"
"quote"               return "t_quote"
{squote}              return "t_quote"
"set!"                return "t_set"
"if"                  return "t_if"
"."                   return "t_dot"

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
    | t_oparen t_begin Definition* t_cparen
        { $$ = ["BEGIN", $3]; }
    ;

VariableDefinition
    : t_oparen t_define Variable Expression t_cparen
        { $$ = ["DEFINE", $3, $4]; }
    | t_oparen t_define t_oparen Variable Variable* t_cparen Body t_cparen
        { $$ = ["DEFINEFUNCTION", $4, $5, $7]; }
    ;

Variable
    : Identifier
    ;

Body
    : Definition* Expression+
        { $$ = ["BODY", $1, $2]; }
    ;

/* Expressions */
Expression
    : Constant
    | Variable
        { $$ = ["VARIABLE", $1]; }
    | t_oparen t_quote Datum t_cparen
        { $$ = ["QUOTE", $3]; }
    | t_oparen t_lambda Formals Body t_cparen
        { $$ = ["LAMBDA", $3, $4]; }
    | t_oparen t_if Expression Expression t_cparen
        { $$ = ["IF", $3, $4]; }
    | t_oparen t_if Expression Expression Expression t_cparen
        { $$ = ["IFELSE", $3, $4, $5]; }
    | t_oparen t_set Variable Expression t_cparen
        { $$ = ["SET", $3, $4]; }
    | Application
    ;

Constant
    : Boolean
    | Number
    | Character
    | String
    ;

Formals
    : Variable
    | t_oparen Variable* t_cparen
        { $$ = $2; }
    ;

Application
    : t_oparen Expression Expression* t_cparen
        { $$ = ["APPLICATION", $2, $3]; }
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
    | Vector
    ;

Boolean
    : t_true
        { $$ = ["BOOLEAN", "TRUE"]; }
    | t_false
        { $$ = ["BOOLEAN", "FALSE"]; }
    ;

Number
    : t_number
        { $$ = ["NUMBER", Number(yytext)]; }
    ;

Character
    : "#\\" letter
        { $$ = ["CHARACTER", yytext]; }
    | "#\\" symchar
        { $$ = ["CHARACTER", yytext]; }
    | "#\\" digit
        { $$ = ["CHARACTER", yytext]; }
    | "#\\newline"
        { $$ = ["CHARACTER", yytext]; }
    | "#\\space"
        { $$ = ["CHARACTER", yytext]; }
    ;

String
    : t_string
        { $$ = ["STRING", yytext]; }
    ;

Symbol
    : Identifier
        { $$ = ["SYMBOL", $1]; }
    ;

List
    : t_oparen Datum* t_cparen
        { $$ = ["LIST", $2]; }
    ;

Vector
    : "#" t_oparen Datum* t_cparen
        { $$ = ["VECTOR", $3]; }
    ;

%%

