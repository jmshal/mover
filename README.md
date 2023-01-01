# mover

Just a couple of scripts I used to move some storage from one server to another.

There are plenty of better ways to do this - I kinda took it upon myself to play
around with Deno for this.

## Getting Started

On the server you'd like to move the storage to, run...

```sh
deno --unstable run --allow-all https://raw.githubusercontent.com/jmshal/mover/main/pull.ts \
  /path/to/folder/you/want/to/populate \
  http://localhost:7890
```

On the server you'd like to move the storage from, run...

```sh
deno --unstable run --allow-all https://raw.githubusercontent.com/jmshal/mover/main/push.ts \
  /path/to/folder/with/all/the/data \
  http://localhost:7890
```
