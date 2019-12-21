# Movie Assistant

Pulls all of the movies out of the Live TV guide of an EmbyServer and provides filtering tools.

## Benefits
- More than 1 days worth of data compared to the Live TV -> Movies page in the normal Emby client
- Ignore non-HD when HD is available
- Really Ugly Interface
- Filter duplicates (future)
- Filter for time of day (future)
- Filter by channels (future)
- Filter by genre (future)

## Use Case
I tend to record movies off of TV, particularly in the middle of the night when everything is otherwise idle, to watch later. This tool helps cut through the crap.

## Install

This is all static (from the server's perspective) content. I dump it into a folder that Nginx serves. You can use pretty much anything.

## Other Notes
Provided as-is

I use this on a LAN that I am in complete control of. I didn't think about protecting your username/password/apiKey at all in developing this. It's up to you to use an https site for protecting your password and up to you to care about your apiKey being sent unencrypted in the URL even if you are using HTTPS (although, at some point, I may, or you!, switch from using the Query Param vs X-Emby-Token header).
