# chatjack

## Bugs

- TODO Pusher flow needs work, buggy
- TODO Screen flickers on restart (missing render call?)
- TODO If you stand before all cards drawn, you can quick draw the dealer, also breaks timer
- TODO !restart !start doesn't work after gameover (command is null)
- TODO hitting non-natural blackjack doesn't tint the auto-stand?
- TODO Logout doesn't destroy !start animation

## Development

- TODO Make sure modules are client only (use window type gaurd)
- TODO make snapshots during big state changes
- TODO have tadjh\_ talk in chat for donation link
- TODO Optionally type gamestate into chat as it happens as a anti-latency accessibility feature, complete with unicode cards and symbols
- TODO harden publish/snapshot endpoint
- TODO invalidate get paths when user logs out or token expires
- TODO Add render order list to layer dynamic
- TODO add DYNAMIC ui layer
- TODO rename ui layer to STATIC
- TODO move action text to dynamic ui layer
- TODO Add test coverage for twitch integration and mediator
- TODO Add donation link

## Quality of life

- TODO let enter channel name be closeable and have a channel name next to logout, and when clicking on it the dropdown shows
- TODO Add !stop command
- TODO Randomize subtitles
- TODO Bust lower opacity
- TODO add particle fx
  - dust when cards hit table or flip over
  - sparkles when blackjack
  - random orbs on title screens a la vegas
