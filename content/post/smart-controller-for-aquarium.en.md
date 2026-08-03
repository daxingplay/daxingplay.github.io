+++
author = "daxingplay"
categories = ["Smart Home", "ESP32", "Home Assistant", "AI"]
date = 2026-08-02T23:30:00+08:00
description = "What started as an algae problem in a Xiaomi fish tank turned into an ESP32 build: ESPHome, peristaltic pumps, level sensors, Home Assistant, and a 3D-printed enclosure."
draft = false
slug = "smart-controller-for-aquarium"
tags = ["ESP32", "ESPHome", "Home Assistant", "Aquarium", "3D Printing", "AI"]
title = "Building a Smart Aquarium Water-Change Controller"
+++

This project started with a very ordinary problem: my Xiaomi aquarium broke out in green algae. The glass looked like someone had rolled out a green carpet across it. The snails were behaving oddly, too — the apple snail kept climbing above the waterline, and the nerite parked itself on the glass and stayed there for the better part of a week. The three zebra danios, meanwhile, were perfectly happy, cruising around like nothing had changed.

I described the symptoms to Gemini and Grok, and they landed on more or less the same diagnosis: healthy-looking fish don't mean healthy water. Snails are far more sensitive to water quality and oxygen than fish are, and a sudden algae bloom paired with strange snail behavior usually means nutrients have piled up, water quality has slipped, and the tank may be running low on oxygen overnight.

So I filled in the details. First-generation Xiaomi tank. Filter running around the clock. Air pump running around the clock. Filter sponge cleaned monthly and replaced a few times along the way. None of that sounds negligent. But there was one big gap: for over a year, I'd only been topping up evaporated water with purified water. I'd never actually taken old water *out*.

That's when Gemini handed me the term I was missing: old tank syndrome.

A filter sponge catches what you can see — fish waste, debris, the chunky stuff. It does nothing about dissolved nitrate, phosphate, or organic waste. Evaporation removes water and leaves everything else behind. What made this counterintuitive is that I'd been topping up with purified water at 5–7 ppm TDS, so this wasn't the usual story of tap-water minerals stacking up year after year. It was fish food and fish waste quietly turning a closed system into soup.

I put a Xiaomi TDS pen in the tank: 325 ppm. That's a deceptively unalarming number. Taken alone it isn't outrageous — in some places tap water comes out close to that. But TDS only tells you there's a lot of dissolved *something* in the water. It won't tell you what. In a healthy aquarium, 325 ppm might be mostly calcium and magnesium. In mine, after a year of pure-water top-ups and zero water changes, a good chunk of it was almost certainly nitrate, phosphate, and organic waste.

That also explains why the danios shrugged it off while the snails and shrimp went first. Danios are tough, and the water degraded slowly enough that they adjusted. Snails and shrimp are much pickier about water quality, osmotic pressure, and buffering. And there was a second, less visible problem with topping up from purified water for that long: KH — carbonate hardness — never got replenished. KH is what buffers the water against acid, and decomposing food and waste produce acid continuously, so the tank had probably been drifting downward in pH for months. For the snails this wasn't just "dirty water." Their shells and bodies were under real stress.

The fix was obvious: change the water. Just not too much at once. For a roughly 20L Xiaomi tank, Gemini suggested easing into it — 10 percent every two or three days, about 1.8 to 2L a time. My first manual change pulled out 1800 mL. I refilled slowly through the rear filter chamber, taking about half an hour, and the water temperature *still* dropped by 2°C.

And that's the catch. To keep the fish, shrimp, and snails from getting shocked, water changes need to be small, frequent, and slow. But the slower it goes, the less sense it makes for a person to stand there supervising. Which is how "this tank needs water changes" became "this tank needs an ESP32."

## The Goal Was Fewer Ways to Fail

When I first floated automatic water changes past Gemini, it came back with a fairly standard AWC design: ESP32, two pumps, two level sensors, relays, timeout protection, anti-siphon measures. Several rounds of back-and-forth later, most of that had been revised.

Ordinary submersible pumps are quiet, but they have to be fully submerged, they don't stop siphoning on their own, and they usually move far more water than I wanted. The Xiaomi tank is cramped as it is, so cramming another pump into the rear chamber or the display area wasn't appealing. Peristaltic pumps are mechanically noisier, but they live outside the tank, self-prime, can't siphon by design, and are trivial to meter by runtime. Since slow and controllable mattered more to me than quiet, I went with two 12V micro peristaltic pumps — one to drain, one to refill.

The sensors took a few rounds too. Cheap contact-style water-level modules are a poor fit for a tank you're going to leave running for years; electrochemical corrosion and heavy-metal leaching aren't risks worth accepting. Optical level sensors can sit inside the rear filter, but mounting them cleanly turned out to be fiddly. I came back around to XKC-Y25 non-contact sensors, stuck to the outside of the tank and the waste container.

The final parts list settled at: an ESP32, two 12V micro peristaltic pumps, a two-channel relay module, XKC-Y25 non-contact level sensors, a DS18B20 waterproof temperature probe, an analog TDS module, a 12V supply, and a DC-DC buck converter.

But the real question was never "can it move water?" It was "can it stop safely when something goes wrong?"

A few principles fell out of that:

- Sequential changes only: drain first, then refill. Never run both pumps at once.
- Calibrate drain and refill flow rates separately. Two identical pumps do not move identical amounts of water.
- The tank high-water and waste-container-full signals get handled locally on the ESP32, never by Home Assistant.
- Keep 12V pump power, 5V module power, and 3.3V signal logic separate. ESP32 GPIO must never see 5V.
- Both pumps default to off at boot. Low-level-trigger relays have to be explicitly inverted in firmware.
- Pumps are inductive loads. Add flyback diodes or TVS protection at the pump itself rather than trusting the relay module to cope.

Some of that is basic electronics. Some of it came from Gemini during the design phase, and the pump protection point in particular caught me off guard. A relay will happily switch a pump on and off, but that doesn't make the reverse voltage spike disappear when the motor stops. Without AI flagging those details while I was buying parts and planning the wiring, I'd probably have wired the pumps straight to the relay and waited for something to die months later.

## Power: 12V for Motors, 5V for the System, 3.3V for Signals

Everything runs off a single 12V 3A adapter. The 12V line feeds the two peristaltic pumps through the switched side of the relay. A branch goes into a DC-DC buck converter, which puts out a stable 5V rail. That rail powers the ESP32's VIN pin, the relay module, and the XKC-Y25 sensors. The ESP32's own 3.3V rail is reserved for the TDS module, the DS18B20, and GPIO pull-up references.

Simplified:

```text
12V adapter
  |
  +--> relay COM --> 12V peristaltic pumps
  |
  +--> buck 5V --> ESP32 VIN + relay VCC + XKC-Y25 VCC
                    |
                    +--> ESP32 3V3 --> TDS / DS18B20 / GPIO pull-up
```

The easiest way to ruin an ESP32 here is to let a sensor output push 5V into a GPIO pin. Some XKC-Y25 variants are open-collector NPN outputs; some module-style versions sit close to VCC when untriggered. What I settled on powers the XKC sensors from 5V but routes OUT through a diode into the GPIO, with a 3.3V pull-up on the ESP32 side. The sensor can pull the pin low, and 5V can't feed back into the ESP32.

Once it was all wired, I still went over it with a multimeter: every signal entering the ESP32 has to sit at or below 3.3V when high.

## Water-Change Logic: Drain First, Refill Second

The instinctive design is to run both pumps together — old water out one side, new water in the other. In practice that's not reliable enough. Even two pumps off the same reel will diverge once tubing length, head height, bends, and back pressure differ. A tiny mismatch each day compounds into steady water-level drift.

So the cycle is sequential:

```text
1. Pre-check: waste container not full, tank not at high-water level
2. Run drain pump for drain_runtime_ms
3. Pause 3 seconds
4. Re-check tank high-water level
5. Run refill pump for fill_runtime_ms
6. Stop and record completion
```

Each change targets 700 mL, and the durations come from measured flow rates rather than guesswork:

```text
runtime_ms = target_volume_ml / flow_rate_ml_min * 60 * 1000
```

My calibration came out as:

- drain pump: 54.5 mL/min
- refill pump: 51.2 mL/min

Those two numbers tell the whole story — same model of tiny pump, measurably different real-world flow. The nice thing about a sequential cycle is that once each pump is calibrated individually, the volume per cycle stays predictable even though the pumps don't match.

## ESPHome Firmware: Don't Block in a Lambda

The firmware is ESPHome.

One thing I was careful about: no long blocking loop inside a lambda. A water-change cycle can run for well over ten minutes, and if the control logic sits inside a blocking lambda, the safety interlocks and the Wi-Fi/API stack get sluggish right when you don't want them to.

Instead, the cycle is built from ESPHome `script` actions and `delay`, with the pump runtimes held in `globals`:

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

Both pump switches use `restore_mode: ALWAYS_OFF`, and the low-level-trigger relays are handled with `inverted: true`. At boot the ESP32 also explicitly turns both pumps off, so a restart can't kick one on by accident.

The tank high-water sensor behaves more like a hardware fuse than a sensor. The moment it trips, ESPHome kills the script locally and shuts off both pumps. The waste-container-full sensor always stops the drain pump, and if a cycle is in progress it aborts the whole thing.

I don't want Home Assistant owning that path. Networks go down, Wi-Fi drops, HA restarts. Anything capable of putting water on the floor gets handled on the controller itself.

## Home Assistant Is Just the Dashboard and the Doorbell

Once ESPHome was talking to Home Assistant, I exposed:

- water temperature
- TDS
- raw TDS analog voltage
- whether a cycle is running
- tank high-water state
- waste-container-full state
- a button to trigger one water change manually
- direct switches for both pumps

One ESPHome gotcha worth knowing: an internal `script` doesn't show up in Home Assistant as a `script.xxx` entity on its own. So I added a `button:` named `Run Aquarium Water Change` for HA to trigger the full cycle.

The Home Assistant automations do nothing but notify. If high water or a full waste container trips while a cycle is running, HA fires off a high-priority alert — but the pumps have already been shut down locally by then.

## The 3D Enclosure Was the Biggest Surprise

With the electronics and firmware working, my desk was a sprawl of bare boards, wires, pumps, and tubing. Not something I wanted parked next to an aquarium. So I asked Claude to help design an enclosure.

I expected a rough shape at best. What I got was a parametric OpenSCAD model that could spit out STLs.

![Aquarium controller enclosure preview](/files/smart-aquarium-controller/case-preview.png)

The final enclosure is a two-level box with a lid, roughly 108 × 104 × 95 mm:

- the lower front chamber holds the two peristaltic pumps
- the lower rear chamber holds the relay and TDS modules, mounted vertically
- the middle tray carries the 90 × 70 mm main board
- the lid has ventilation slots and screw holes
- a divider separates the pump chamber from the electronics to limit leak damage

It isn't meant to be waterproof. It's meant to keep splashes contained: if water drips off the pump tubing, it shouldn't run straight into the ESP32 and the relay module.

Printed, the dimensions were essentially correct — pumps, board, and screw holes all lined up. The one flaw was a missing slot where a latch had to mate with another part. I missed it in review and ended up cutting the slot by hand with pliers. On the whole, this was the part of the project that surprised me most. OpenSCAD describes geometry as code, which turns out to be a remarkably good fit for AI-assisted mechanical design.

## What It Does Now

I later picked up two 3L containers, one for prepared new water and one for waste. One XKC-Y25 sits on the waste container so draining stops when it fills. The other sits on the tank so refilling stops at the upper water line.

The system now:

- runs one scheduled 700 mL micro water change per day
- drains first and refills second, never both at once
- controls drain and refill durations from measured flow rates
- reports water temperature, TDS, and level states to Home Assistant
- triggers a manual water change from a button
- shuts the pumps down locally on high water or a full waste container
- keeps pumps and electronics in separate chambers inside a printed enclosure

It's not a complicated project, but it touches a lot of the classic smart-home DIY problems at once: low-voltage power distribution, signal-level protection, inductive loads, sensor interlocks, firmware state machines, Home Assistant integration, and printed parts.

## Where AI Actually Helped

I could have built this without AI, but it would have eaten several weekends: researching parts, picking models, drawing up wiring, writing the ESPHome config, debugging sensor voltage levels, and learning enough OpenSCAD to produce an enclosure.

The more interesting thing is that AI didn't just help me implement a requirement I'd already written down — it helped shape the requirement. I started with "what's wrong with these two snails?" That became "why didn't the algae consume the waste I can't see?" Which became "could an ESP32 handle water changes unattended?" Only after all that did it turn into wiring, firmware, soldering, assembly, and enclosure design.

It felt like having a few specialists in the room:

- Gemini took me from aquarium symptoms to a water-quality diagnosis and a water-change plan.
- It kept going, narrowing down the hardware design and the Taobao shopping list while flagging aquarium-specific pitfalls.
- Claude turned the electrical design into wiring diagrams, a soldering checklist, and the ESPHome configuration.
- Later it generated the printed enclosure in OpenSCAD.
- And when I hit low-level-trigger relay inversion, ESPHome script exposure, XKC output levels, or the question of whether AWG30 wire could carry main power, AI could usually pinpoint the problem fast.

My main takeaway is that AI lowers the barrier to smart-home DIY substantially. It's especially good at surfacing the traps that are easy to miss up front and painful to discover mid-build: pump back EMF, sensor voltage levels, siphoning, what a pump does when it runs dry, waste-container overflow, and how to get an ESPHome script into Home Assistant.

The enclosure surprised me the most. I'd always assumed mechanical design was the part I'd still have to draw out slowly by hand. This time AI produced a usable OpenSCAD enclosure outright, and it was the first time it felt like code, electronics, and mechanical parts in a personal hardware project could all hang off a single continuous conversation.

The tedious parts haven't gone anywhere, of course. Buying from Taobao off Gemini's list still meant verifying models, connectors, and sellers myself. Soldering, assembly, and testing next to a live fish tank still happen in the physical world. It'll be a while before a robot takes that over for me.

But if sites like Taobao ever open up to agents, an agent could do a lot more than hand you a shopping list. It could filter parts against your constraints, compare shops, check compatibility, and hand the finished order straight to assembly instructions. That would change personal hardware DIY quite a bit.

Changing aquarium water is a small thing. But having built this little controller, I'm a lot more optimistic about AI-assisted personal hardware. Plenty of home automations that used to feel too annoying to start might slowly turn into real devices this way.
