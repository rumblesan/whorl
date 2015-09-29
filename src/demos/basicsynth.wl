
; defining a basic synth

(let basic
  (amp
    (osc (param "freq" 440) "square")
    (arEnv 0.1 0.2)
  )
)

(let synth (createSynth basic))

(routeToMaster synth)

(play synth 1)

