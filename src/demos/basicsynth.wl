
; defining a basic synth

(define basic
  (amp
    (osc (param "freq" 440) "square")
    (arEnv 0.1 0.2)
  )
)

