# chatjack

## Bugs

- TODO Screen flickers on restart (missing render call?)
- TODO disconnected caption
- TODO Disabled timer zoom in, until I can fix the fact that angle increments based on start time not phase start seemingly

## Development

- TODO make snapshots during big state changes
- TODO harden publish/snapshot endpoint
- TODO Add test coverage for twitch integration and mediator

## Features

- TODO have tadjh\_ talk in chat for donation link
- TODO Add donation link
- TODO Optionally type gamestate into chat as it happens as a anti-latency accessibility feature, complete with unicode cards and symbols
- TODO Add render order list to layer dynamic
- TODO add particle fx
  - dust when cards hit table or flip over
  - sparkles when blackjack
  - random orbs on title screens a la vegas

## Quality of life

- TODO Add Jack Queen and King portraits to cards

## Performance & Optimization

- TODO invalidate get paths when user logs out or token expires
- TODO Don't connect on spectate paths that haven't been registered by mods of said channel
