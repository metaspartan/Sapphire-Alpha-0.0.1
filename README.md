# Sapphire-Alpha-0.0.1
EGEM Sidechain Client

And so here it is. The long awaited sidechain peer for creating nodes on the EtherGem (EGEM) Sidechain Sapphire.

Absolutely Alpha software right now.

Block construction:

This is not final

| Headers: | Data Format: | Example: |
| ------------- | ------------- | ------------- |
| Block Number | tbp | tbp |
| EGEM Back Reference block | tbp | tbp |
| Egem Back Reference Block Hash | tbp | tbp |
| Previous Block Hash | tbp | tbp |
| AllConfig | tbp | tbp |
| AllConfigHash | tbp | tbp |
| Data | tbp | tbp |
| Sponsor | tbp | tbp |
| Miner | tbp | tbp |
| Transactions | tbp | tbp |
| Hardware Tx | tbp | tbp |
| Software Tx | tbp | tbp |
| Target Block | tbp | tbp |
| Target Block Data Hash | tbp | tbp |
| Hash of this Block | tbp | tbp |


Tasking:

A) ALL TIMESTAMPS date.now need to be in UTC time 

1) when blocks are given by peer in synch need to verify chain hashing to previous blocks and reject
test this with address balances
is chain synch to database yet?

2) blocks need to be completed for Hardware Tx, Software TX, Target Block, Target Block Data Hash, All Config, All Config Hash

3) javascript wrapper libraries (calling it web4) is being added for sapphire interaction

4) hashed code compare is activated for genesis.js and the bones for peer.js are there but not being checked
add a check for all files

5) ordergate being completed

6) add protocol version for releases
and if protocol version < current version and > tolerated then hash = xyz is okay

7) level db direct interactions
