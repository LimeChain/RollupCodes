const solidityEquivalents: {[key: string]: string} = {
  "ORIGIN": "tx.origin",                    // 32
  "CALLER": "msg.sender",                   // 33
  "BLOCKHASH": "blockhash(x)",              // 40
  "COINBASE": "block.coinbase",             // 41
  "TIMESTAMP": "block.timestamp",           // 42
  "NUMBER": "block.number",                 // 43
  "DIFFICULTY": "block.difficulty",         // 44
  "PREVRANDAO": "block.prevrandao",         // 44
  "BASEFEE": "block.basefee",               // 48
  "BLOBHASH": "blobhash(index)",            // 49
  "BLOBBASEFEE": "block.blobbasefee",       // 4a
  "TLOAD": "tload(key)",                    // 5c
  "TSTORE": "tstore(key, value)",           // 5d
  "MCOPY": "mcopy(dst, src, length)",       // 5e
  "CREATE": "new C()",                      // f0
  "CREATE2": "new C{salt: _s}()",           // f5
  "SELFDESTRUCT": "selfdestruct(address)",  // ff
}

// TODO: it's possible to have 2 contracts with the same name on different networks. Maybe pass the network as a param as well? 
const systemContractUrls: {[key: string]: string} = {
  "BeaconRootsStorage": "https://eips.ethereum.org/EIPS/eip-4788",
}

export const solidityEquivalent = (opcode: string): string => {
  return solidityEquivalents[opcode]
}

export const systemContractUrl = (contract: string): string => {
  return systemContractUrls[contract]
}
