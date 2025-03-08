# chatjack

## Bugs

- TODO Loading... shows even after connected
- TODO Vignette fades away instead of staying visible
- TODO !restart !start doesn't work after gameover (command is null)
- TODO If you stand before all cards drawn, you can quick draw the dealer, also breaks timer
- TODO hitting non-natural blackjack doesn't tint the auto-stand?
- TODO Logout doesn't destroy !start animation
- TODO Screen flickers on restart (missing render call?)
- TODO disconnected caption

## Development

- TODO Make sure modules are client only (use window type gaurd)
- TODO Homepage with buttons: Host or Spectate
- TODO make snapshots during big state changes
- TODO harden publish/snapshot endpoint
- TODO invalidate get paths when user logs out or token expires
- TODO Add test coverage for twitch integration and mediator

## Features

- TODO have tadjh\_ talk in chat for donation link
- TODO Add donation link
- TODO Optionally type gamestate into chat as it happens as a anti-latency accessibility feature, complete with unicode cards and symbols
- TODO Add render order list to layer dynamic
- TODO add DYNAMIC ui layer
- TODO rename ui layer to STATIC
- TODO move action text to dynamic ui layer
- TODO Randomize subtitles

## Quality of life

- TODO caption should equal "offline" when unable to connect to twitch chat
- TODO Rename SearchProvider to RendererOptions or something to indicate what it actually does
- TODO Add !stop command
- TODO Bust lower opacity
- TODO add particle fx
  - dust when cards hit table or flip over
  - sparkles when blackjack
  - random orbs on title screens a la vegas

## Performance

- TODO Don't connect on spectate paths that haven't been registered by mods of said channel
