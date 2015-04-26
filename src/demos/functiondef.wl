
; function definition

(define (func a b)
  (define c (+ a b))
  (* c b)
)

(display (func 3 4))

