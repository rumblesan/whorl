
; defining a basic synth

(define basic
  (amp
    (osc (param "freq" 440) "square")
    (arEnv 0.1 0.2)
  )
)

(define synth (createSynth basic))

(routeToMaster synth)

(play synth 1)

