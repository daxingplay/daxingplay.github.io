+++
author = "daxingplay"
categories = ["Smart Home", "ESP32", "Home Assistant", "AI"]
date = 2026-08-02T23:30:00+08:00
description = "From aquarium water trouble to ESP32, ESPHome, peristaltic pumps, level sensors, Home Assistant, and a 3D-printed enclosure: a small Xiaomi fish tank water-change project turned into smart-home infrastructure."
draft = false
slug = "smart-controller-for-aquarium"
tags = ["ESP32", "ESPHome", "Home Assistant", "Aquarium", "3D Printing", "AI"]
title = "Building a Smart Aquarium Water-Change Controller"
+++

This project started with a very ordinary problem: my Xiaomi aquarium suddenly grew a lot of green algae. The glass looked as if someone had laid down a green carpet. The snails were acting strangely too. The apple snail kept climbing above the waterline, and the nerite snail stayed stuck to the glass for almost a week. Meanwhile, the three zebra danios looked completely fine, swimming around as usual.

I described the symptoms to Gemini and Grok. Both models gave roughly the same diagnosis: just because the fish look fine does not mean the water is fine. Snails are more sensitive to water quality and oxygen changes. A sudden algae bloom plus abnormal snail behavior usually points to accumulated nutrients, deteriorating water quality, and possible nighttime oxygen stress.

Then I added more context: this was a first-generation Xiaomi fish tank. The filter ran all day. The air pump ran all day. I cleaned the filter sponge every month and had replaced it a few times. On the surface, the maintenance did not sound careless. But there was one major problem: for more than a year, I had mostly only topped up evaporated water with purified water. I had not been actively removing old water.

At that point Gemini gave me the right phrase: old tank syndrome.

The filter sponge catches visible fish waste and debris, but it does not remove dissolved nitrate, phosphate, or organic waste. Evaporation only removes water; the waste stays behind. The surprising part was that I had been topping up with purified water with a TDS of only 5 to 7 ppm. So this was not the usual story of minerals endlessly accumulating from tap water. It was fish food and waste slowly turning a closed system into a different kind of soup.

I measured the tank with a Xiaomi TDS pen: 325 ppm. That number is subtle. By itself, it is not outrageous. In some places, tap water can be close to that. But TDS only tells you that there is a lot of dissolved stuff in the water. It does not tell you what that stuff is. In a healthy aquarium, 325 ppm might mostly be calcium and magnesium. In my tank, after a year of pure-water top-ups and no water changes, much of it was more likely nitrate, phosphate, and organic waste.

That also explains why the zebra danios could tolerate it while the snails and shrimp failed first. Danios are hardy, and the water degraded gradually. Snails and shrimp are more sensitive to water quality, osmotic pressure, and buffering capacity. There was another hidden issue with long-term purified-water top-ups: KH, or carbonate hardness, had not been replenished. KH is the water's acid-buffering capacity. Meanwhile, decomposing food and waste kept producing acidic compounds, so the tank may have been slowly crashing in pH. For snails, this was not merely "dirty water"; their shells and bodies were under stress.

The fix was simple: change the water. But not too much at once. Gemini suggested starting gently for a roughly 20L Xiaomi tank: change 10 percent every two or three days, around 1.8 to 2L each time. My first manual change removed 1800 mL. I refilled slowly through the rear filter chamber over about half an hour, and the water temperature still dropped by 2 degrees Celsius.

That was the interesting part. To avoid stressing the fish, shrimp, and snails, water changes should be small, repeated, and slow. But the slower the process is, the less sense it makes for a human to stand there watching it. So the project went from "this tank needs water changes" to an ESP32 + ESPHome serial micro water-change system.

## The Goal Was Fewer Ways to Fail

When I first discussed automatic water changes with Gemini, it suggested a fairly standard AWC setup: ESP32, two pumps, two level sensors, relays, timeout protection, and anti-siphon design. After several rounds of discussion, the design kept getting revised.

Regular submersible pumps are quiet, but they have to sit fully in the water, do not naturally prevent siphoning, and usually move too much water. The Xiaomi tank is also compact, so adding another pump inside the rear chamber or main tank was not ideal. Peristaltic pumps are mechanically noisier, but they can sit outside the tank, self-prime, prevent siphoning by design, and are easy to meter by runtime. Since I cared most about slow and controllable flow, I chose two 12V micro peristaltic pumps: one for draining, one for refilling.

The sensor choice also went through a few rounds. Cheap contact-style water-level modules are a bad fit for long-term aquarium use because electrochemical corrosion and heavy-metal leaching are not risks worth taking. Optical level sensors can sit inside the rear filter, but mounting them cleanly was harder. In the end I returned to XKC-Y25 non-contact level sensors, attached outside the tank and waste-water container.

The final hardware list settled into: an ESP32, two 12V micro peristaltic pumps, a two-channel relay module, XKC-Y25 non-contact level sensors, a DS18B20 waterproof temperature probe, an analog TDS module, a 12V power supply, and a DC-DC buck converter.

But the real problem was not "can it move water?" It was "can it stop safely when something goes wrong?"

I ended up with a few principles:

- Use serial water changes only: drain first, then refill. Do not run both pumps at the same time.
- Calibrate drain and refill flow rates separately. Do not assume two identical pumps actually move the same amount of water.
- Tank high-water and waste-container full signals must be handled locally by the ESP32, not by Home Assistant.
- Keep 12V pump power, 5V module power, and 3.3V signal logic separated. ESP32 GPIO pins must never see 5V.
- On boot, both pumps must default to off. Low-level-trigger relays must be explicitly inverted in firmware.
- Pumps are inductive loads. Add flyback diodes or TVS protection at the pump side instead of trusting the relay module alone.

Some of these are basic electronics, but some were things Gemini reminded me about during the design. The pump protection point was one of the surprises. A relay can switch a pump on and off, but that does not make the reverse voltage spike disappear when the motor stops. Without AI calling out those details during the buying and wiring phase, I might have simply connected the pumps to the relay and waited for something to fail later.

## Power: 12V for Motors, 5V for the System, 3.3V for Signals

The whole system uses a single 12V 3A adapter. The 12V line feeds the two peristaltic pumps through the relay power side. A branch goes into a DC-DC buck converter, which outputs a stable 5V rail. That 5V rail powers the ESP32 VIN pin, the relay module, and the XKC-Y25 level sensors. The ESP32's own 3.3V rail is only used for the TDS module, the DS18B20, and GPIO pull-up references.

In simplified form:

```text
12V adapter
  |
  +--> relay COM --> 12V peristaltic pumps
  |
  +--> buck 5V --> ESP32 VIN + relay VCC + XKC-Y25 VCC
                    |
                    +--> ESP32 3V3 --> TDS / DS18B20 / GPIO pull-up
```

The easiest mistake is letting a sensor output drive 5V into an ESP32 GPIO pin. Some XKC-Y25 variants are open-collector NPN outputs. Some module-style versions may output close to VCC when not triggered. My final wiring powers the XKC sensors from 5V, but routes OUT through a diode into the ESP32 GPIO. The GPIO side uses a 3.3V pull-up. The goal is to let the sensor pull the GPIO low while blocking 5V from feeding back into the ESP32.

After wiring, I still checked it with a multimeter: every signal entering the ESP32 must stay at or below 3.3V when high.

## Water-Change Logic: Drain First, Refill Second

The natural first thought is to run both pumps together: one drains old water while the other adds new water. In the real world, that is not reliable enough. Even two identical peristaltic pumps will differ once the tubing length, head height, bends, and back pressure are different. A tiny daily mismatch becomes slow water-level drift.

So I switched to a serial process:

```text
1. Pre-check: waste container is not full, tank is not at high-water level
2. Run drain pump for drain_runtime_ms
3. Pause for 3 seconds
4. Check tank high-water level again
5. Run refill pump for fill_runtime_ms
6. Stop and record completion
```

Each water change targets 700 mL. The drain and refill durations are calculated from measured flow rates rather than guessed:

```text
runtime_ms = target_volume_ml / flow_rate_ml_min * 60 * 1000
```

The example calibration values I used were:

- drain pump: 54.5 mL/min
- refill pump: 51.2 mL/min

Those two numbers tell the story: same type of small pump, different real-world flow rate. The advantage of serial water changes is that, once each pump is calibrated, the volume per cycle remains controllable even when the two pumps do not match.

## ESPHome Firmware: Do Not Block in a Lambda

The firmware is written in ESPHome.

One thing I cared about was avoiding a long blocking loop inside a lambda. A water-change cycle can run for more than ten minutes. If the control logic sits inside a blocking lambda, safety interlocks and the Wi-Fi/API stack can become less responsive.

Instead, the current approach uses ESPHome `script` actions and `delay`, with pump runtimes stored in `globals`:

```yaml
script:
  - id: sync_water_change_script
    mode: single
    then:
      - lambda: |-
          id(drain_runtime_ms) = ...;
          id(fill_runtime_ms) = ...;
      - switch.turn_on: drain_pump
      - delay: !lambda "return id(drain_runtime_ms);"
      - switch.turn_off: drain_pump
      - delay: 3s
      - switch.turn_on: fill_pump
      - delay: !lambda "return id(fill_runtime_ms);"
      - switch.turn_off: fill_pump
```

Both pump GPIO switches use `restore_mode: ALWAYS_OFF`. The low-level-trigger relays are handled with `inverted: true`. On boot, the ESP32 also explicitly turns both pumps off to avoid accidental activation during restart.

The tank high-water sensor acts more like a hardware fuse. Once triggered, ESPHome locally stops the script and turns off both pumps. The waste-container full sensor always stops the drain pump; if the system is currently draining, it aborts the whole cycle.

I do not want Home Assistant to own that safety path. Networks fail. Wi-Fi drops. HA restarts. Anything that can flood water onto the floor must be handled on the controller itself.

## Home Assistant Is Only the Panel and Notification Layer

After connecting ESPHome to Home Assistant, I exposed these entities:

- water temperature
- TDS
- raw TDS analog voltage
- whether a water-change cycle is running
- tank high-water state
- waste-container full state
- a button to manually trigger one water-change cycle
- direct switches for both pumps

One small ESPHome gotcha: an internal ESPHome `script` does not automatically appear in Home Assistant as a `script.xxx` entity. So I exposed a `button:` called `Run Aquarium Water Change`, which HA can use to trigger the full cycle.

Home Assistant automation only sends notifications. If high water or waste-container full is triggered while a cycle is running, HA sends a high-priority alert. The actual pump shutdown still happens locally on the ESP32.

## The 3D Enclosure Was the Biggest AI Surprise

After the electronics and firmware were working, the desk was covered with exposed boards, wires, pumps, and tubes. That is not something I wanted sitting next to an aquarium. So I asked Claude to help design an enclosure.

I expected a rough structure at best. Instead, it generated a parametric OpenSCAD model and could output STL files.

![Aquarium controller enclosure preview](/files/smart-aquarium-controller/case-preview.png)

The final enclosure is a two-layer box with a lid, roughly 108 x 104 x 95 mm:

- the lower front chamber holds the two peristaltic pumps
- the lower rear chamber holds the relay and TDS modules vertically
- the middle tray holds the 90 x 70 mm main control board
- the lid has ventilation slots and screw holes
- a divider separates the pump chamber from the electronics chamber to reduce leak risk

The goal is not waterproof sealing. It is splash separation: if water drips near the pump tubing, it should not flow directly into the ESP32 and relay module.

After printing, the dimensions were mostly right. The pumps, board, and screw holes lined up. The only flaw was a missing slot for one latch to connect with another part. I missed it during review and later cut a slot by hand with pliers. Overall, this was the part that surprised me most. OpenSCAD, where geometry is described as code, turns out to be a very natural format for AI-assisted mechanical design.

## What It Does Now

Later I bought two small 3L containers: one for prepared new water and one for waste water. One XKC-Y25 is attached to the waste container so draining stops when it is full. Another is attached to the tank so refilling stops at the upper water line.

The system can now:

- run one scheduled 700 mL micro water change every day
- drain first, refill second, without running both pumps together
- control drain and refill durations using measured flow rates
- send water temperature, TDS, and water-level states into Home Assistant
- trigger one manual water change from a button
- stop pumps locally when tank high-water or waste-container full is detected
- keep the pump chamber and electronics chamber separated in a printed enclosure

This is not a complicated project, but it touches several classic smart-home DIY problems: low-voltage power distribution, signal-level protection, inductive loads, sensor interlocks, firmware state machines, Home Assistant integration, and 3D-printed parts.

## Where AI Actually Helped

Without AI, I could still have built this project, but it probably would have taken several weekends: researching parts, choosing models, drawing wiring diagrams, writing ESPHome, debugging sensor voltage levels, and learning enough OpenSCAD to make an enclosure.

The most interesting part was that AI did not just help implement a predefined requirement. It helped shape the requirement itself. I started by asking, "What is wrong with these two snails?" Then the discussion became "Why did the algae not consume the invisible waste?" Then it became "Can an ESP32 make water changes unattended?" Only after that did it turn into wiring, firmware, soldering, assembly, and enclosure design.

It felt like having several domain helpers in the room:

- Gemini helped move from aquarium symptoms to water-quality diagnosis and a water-change plan.
- It continued helping narrow the hardware design and Taobao shopping list, while pointing out aquarium-specific pitfalls.
- Claude helped turn the electrical design into wiring diagrams, soldering checklists, and ESPHome configuration.
- Later it generated the 3D-printed enclosure in OpenSCAD.
- When I ran into low-level-trigger relay inversion, ESPHome script exposure, XKC output levels, and whether AWG30 wire could carry main power, AI could usually localize the problem quickly.

My biggest takeaway is that AI significantly lowers the barrier for smart-home DIY. It is especially good at surfacing the hidden traps that are easy to miss at the start but painful in the real build: pump back EMF, sensor voltage levels, siphoning, pump dry-run behavior, waste-container overflow, and how to expose ESPHome scripts to Home Assistant.

The 3D enclosure surprised me the most. I used to assume mechanical structure was something I would still have to draw slowly by myself. This time AI produced a usable OpenSCAD enclosure directly. It made me feel, for the first time, that code, electronics, and mechanical parts in a personal hardware project can all be connected through one continuous conversation.

Of course, the time-consuming parts did not disappear. Buying parts from Taobao based on Gemini's list still meant checking models, interfaces, and sellers myself. Soldering, assembly, and testing beside a real fish tank still had to happen in the physical world. It will take a while before robots can completely replace me there.

But if sites like Taobao become more open to agents in the future, an agent could do more than produce a shopping list. It could filter models under constraints, compare shops, check compatibility, and connect the final order to assembly instructions. That would change the experience of personal hardware DIY quite a lot.

Changing aquarium water is a small thing. But after building this little controller, I feel much more confident about the path of AI-assisted personal hardware projects. A lot of home automations that once felt too annoying to start may gradually become real devices this way.
