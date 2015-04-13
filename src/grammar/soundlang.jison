
%lex

/* lexical grammar */

letter                [a-zA-Z]
digit                 [0-9]
dquote                "\""
squote                "'"
symchar               [!$%&*/:<=>?~_^]

%%

/* comments */
";".*\n               /* skip comments */
";".*<<EOF>>          /* skip comments */

/* brackets */
"("                   return "t_oparen"
")"                   return "t_cparen"

{number}              return "t_number"
{identifier}          return "t_id"

/* syntax bits */
"begin"               return "t_begin"
"define"              return "t_define"
"lambda"              return "t_lambda"
"quote"               return "t_quote"
"'"                   return "t_quote"
"\""                  return "t_dquote"
"set!"                return "t_set"
"if"                  return "t_if"
"."                   return "t_dot"

/* booleans */
"#t"                  return "t_true"
"#f"                  return "t_false"
/* misc */
<<EOF>>               return "t_eof"
[ \t\n]+              /* skip whitespace */
.                     return "INVALID"


/lex

%token                t_oparen
%token                t_cparen
%token                t_true
%token                t_false
%token                t_number
%token                t_id
%token                t_define
%token                t_lambda
%token                t_set
%token                t_eof

%start Program

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
        { return [$2, $3]; }
    ;

VariableDefinition
    : t_oparen t_define Variable Expression t_cparen
        { return ["DEFINE", $3, $4]; }
    | t_oparen t_define t_oparen Variable Variable* t_cparen Body t_cparen
        { return ["DEFINE", $4, $5, $7]; }
    | t_oparen t_define t_oparen Variable Variable* t_dot Variable t_cparen Body t_cparen
        { return ["DEFINE", $4, $5, $7, $9]; }
    ;

Variable
    : Identifier
    ;

Body
    : Definition* Expression+
        { return ["BODY", $1, $2]; }
    ;

/* Expressions */
Expression
    : Constant
    | Variable
    | t_oparen t_quote Datum t_cparen
        { return ["QUOTE", $3]; }
    | t_oparen t_lambda Formals Body t_cparen
        { return ["LAMBDA", $3, $4]; }
    | t_oparen t_if Expression Expression t_cparen
        { return ["IF", $3, $4]; }
    | t_oparen t_if Expression Expression Expression t_cparen
        { return ["IF", $3, $4, $5]; }
    | t_oparen t_set Variable Expression t_cparen
        { return ["SET", $3, $4]; }
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
        { return $2; }
    | t_oparen Variable+ t_dot Variable t_cparen
        { return [$2, $4]; }
    ;

Application
    : t_oparen Expression Expression* t_cparen
        { return [$2, $3]; }
    ;

/* Identifiers */
Identifier
    : Initial Subsequent*
        { return ($1 + $3); }
    | "+"
    | "-"
    ;

Initial
    : letter
    | symchar
    ;

Subsequent
    : Initial
    | digit
    | "."
    | "+"
    | "_"
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
        { return "TRUE"; }
    | t_false
        { return "FALSE"; }
    ;

Number
    : t_number
        { $$ = ["NUMBER", Number(yytext)]; }
    ;

Character
    : "#\\" letter
    | "#\\" symchar
    | "#\\" digit
    | "#\\newline"
    | "#\\space"
    ;

String
    : t_dquote StringCharacter* t_dquote
        { $$ = ["STRING", $2]; }
    ;

StringCharacter
    : letter
    | digit
    | symchar
    ;

Symbol
    : Identifier
    ;

List
    : t_oparen Datum* t_cparen
        { return ["LIST", $2]; }
    | t_oparen Datum+ t_dot Datum t_cparen
        { return ["LIST", $2, $4]; }
    ;

Vector
    : "#" t_oparen Datum* t_cparen
        { return ["VECTOR", $3]; }
    ;

