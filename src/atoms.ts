import { atom } from 'precoil'
import type { TokenizeResult } from './core/tokenize'
import { generateAddressArr } from './core/assemble'

const DEFAULT_INPUT = `mov al, 5A
mov bl, D3

loop:
mov [bl], al
dec al
cmp al, 40
jz done
inc bl
jz reset
jmp loop

reset:
mov bl, c0
jmp loop

done:
end
`

export const codeState = atom(DEFAULT_INPUT)

export const tokenState = atom<TokenizeResult>({
  statements: [],
  labels: []
})

export const addressState = atom(generateAddressArr(true))

export const errorState = atom<string | null>(null)
