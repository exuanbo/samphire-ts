import { Statement } from '../src/utils/tokenize'
import {
  generateAddressArr,
  getMovOpcode,
  getArithmeticOpcode,
  getCompareOpcode,
  getStaticOpcode,
  getOpcode,
  GenerateOpcodesFromStatementResult,
  generateOpcodesFromStatement,
  assemble
} from '../src/utils/assembler'
import {
  Keyword,
  ArithmeticKeyword,
  StaticOpcodeKeyword,
  ArgType,
  OPCODE_MAPPING
} from '../src/utils/constants'
import { statementsAfterCalcLables, labels } from './tokenize.test'
import { statementToString } from './utils'

describe('generateAddressArr', () => {
  it('should generate address array', () => {
    const res = generateAddressArr(false)
    expect(res.length).toBe(0x100)
    expect(res[0xc0]).toBe(0x00)
  })

  it('should generate address array with VDU initialized', () => {
    const res = generateAddressArr(true)
    expect(res.length).toBe(0x100)
    expect(res[0xc0]).toBe(0x20)
    expect(res[0xff]).toBe(0x20)
  })
})

describe('getMoveOpcode', () => {
  it('should work when move register <- number', () => {
    const res = getMovOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Number, value: 0x01 }
    )
    expect(res).toBe(0xd0)
  })

  it('should work when move register <- address', () => {
    const res = getMovOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Address, value: 0x01 }
    )
    expect(res).toBe(0xd1)
  })

  it('should work when move register <- registerPointer', () => {
    const res = getMovOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.RegisterPointer, value: 0x01 }
    )
    expect(res).toBe(0xd3)
  })

  it('should work when move address <- register', () => {
    const res = getMovOpcode(
      { type: ArgType.Address, value: 0x00 },
      { type: ArgType.Register, value: 0x01 }
    )
    expect(res).toBe(0xd2)
  })

  it('should work when move registerPointer <- register', () => {
    const res = getMovOpcode(
      { type: ArgType.RegisterPointer, value: 0x00 },
      { type: ArgType.Register, value: 0x01 }
    )
    expect(res).toBe(0xd4)
  })
})

const arithmeticKeywords: ArithmeticKeyword[] = [
  Keyword.ADD,
  Keyword.SUB,
  Keyword.MUL,
  Keyword.DIV
]

const getDynamicOpcode = (keyword: ArithmeticKeyword): [number, number] =>
  OPCODE_MAPPING[Keyword[keyword]] as [number, number]

describe('getArithmeticOpcode', () => {
  arithmeticKeywords.forEach(keyword => {
    it(`should work with '${keyword}' when 'src.type === ArgType.Register'`, () => {
      const res = getArithmeticOpcode(
        keyword,
        { type: ArgType.Register, value: 0x00 },
        { type: ArgType.Register, value: 0x01 }
      )
      expect(res).toBe(getDynamicOpcode(keyword)[0])
    })

    it(`should work with '${keyword}' when 'src.type === ArgType.Number'`, () => {
      const res = getArithmeticOpcode(
        keyword,
        { type: ArgType.Register, value: 0x00 },
        { type: ArgType.Number, value: 0x01 }
      )
      expect(res).toBe(getDynamicOpcode(keyword)[1])
    })

    it(`should return undefined with '${keyword}' if arg is invalid`, () => {
      const res = getArithmeticOpcode(
        keyword,
        { type: ArgType.Register, value: 0x00 },
        { type: ArgType.Address, value: 0x01 }
      )
      expect(res).toBe(undefined)
    })
  })
})

describe('getCompareOpcode', () => {
  it(`should work when compare with 'arg2.type === ArgType.Register'`, () => {
    const res = getCompareOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Register, value: 0x01 }
    )
    expect(res).toBe(0xda)
  })

  it(`should work when compare with 'arg2.type === ArgType.Address'`, () => {
    const res = getCompareOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Address, value: 0x01 }
    )
    expect(res).toBe(0xdc)
  })

  it(`should work when compare with 'arg2.type === ArgType.Address'`, () => {
    const res = getCompareOpcode(
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Number, value: 0x01 }
    )
    expect(res).toBe(0xdb)
  })

  it(`should return undefined if arg1 in invalid`, () => {
    const res = getCompareOpcode(
      { type: ArgType.Address, value: 0x00 },
      { type: ArgType.Register, value: 0x01 }
    )
    expect(res).toBe(undefined)
  })
})

const staticOpcodeKeywords: StaticOpcodeKeyword[] = [
  Keyword.INC,
  Keyword.DEC,
  Keyword.JMP,
  Keyword.JZ,
  Keyword.JNZ
]

describe('getOpcode', () => {
  staticOpcodeKeywords.forEach(keyword => {
    it(`should return correct opcode with '${keyword}' AL`, () => {
      const res = getOpcode(keyword, { type: ArgType.Register, value: 0x00 })
      expect(res).toBe(getStaticOpcode(keyword))
    })
  })

  it("should return correct opcode with 'MOV'", () => {
    const res = getOpcode(
      Keyword.MOV,
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Number, value: 0x01 }
    )
    expect(res).toBe(0xd0)
  })

  arithmeticKeywords.forEach(keyword => {
    it(`should return correct opcode with '${keyword}'`, () => {
      const res = getOpcode(
        keyword,
        { type: ArgType.Register, value: 0x00 },
        { type: ArgType.Register, value: 0x01 }
      )
      expect(res).toBe(getDynamicOpcode(keyword)[0])
    })
  })

  it("should return correct opcode with 'CMP'", () => {
    const res = getOpcode(
      Keyword.CMP,
      { type: ArgType.Register, value: 0x00 },
      { type: ArgType.Register, value: 0x01 }
    )
    expect(res).toBe(0xda)
  })
})

const statementOpcodes: GenerateOpcodesFromStatementResult[] = [
  [0xd0, 0x03, 0x0a],
  [0xd0, 0x00, 0x00],
  [0xd0, 0x01, 0xc0],
  [0xb0, 0x00, 0x30],
  [0xd4, 0x01, 0x00],
  [0xb1, 0x00, 0x30],
  [0xa4, 0x00],
  [0xa4, 0x01],
  [0xda, 0x00, 0x03],
  [0xc1, 0x04],
  [0xc0, 0xee],
  [0x00]
]

const statementsWithIllegalArgs: Statement[] = [
  { key: 'MOV', args: ['ALL', 'BL'] },
  { key: 'ADD', args: ['AL', 'BLL'] },
  { key: 'INC', args: ['ABC'] }
]

describe('generateOpcodesFromStatements', () => {
  statementsAfterCalcLables.forEach((statement, index) => {
    it(`should work with '${statementToString(
      statement
    )}' on line ${index}`, () => {
      const res = generateOpcodesFromStatement(statement)
      expect(res).toStrictEqual(statementOpcodes[index])
    })
  })

  statementsWithIllegalArgs.forEach((statement, index) => {
    const { args } = statement
    it(`should throw an error with '${statementToString(statement)}'`, () => {
      expect.assertions(1)
      try {
        generateOpcodesFromStatement(statement)
      } catch (err) {
        expect((err as Error).message).toBe(
          `Illegal argument '${(args as string[])[index > 1 ? 0 : index]}'`
        )
      }
    })
  })

  it('should return undefined if args is undefined', () => {
    const res = generateOpcodesFromStatement({ key: 'MOV', args: undefined })
    expect(res).toStrictEqual(undefined)
  })
})

// eslint-disable-next-line prettier/prettier
const assembledAddress = [0xd0, 0x03, 0x0a, 0xd0, 0, 0, 0xd0, 0x01, 0xc0, 0xb0, 0, 0x30, 0xd4, 0x01, 0, 0xb1, 0, 0x30, 0xa4, 0, 0xa4, 0x01, 0xda, 0, 0x03, 0xc1, 0x04, 0xc0, 0xee, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20]

describe('assemble', () => {
  statementsAfterCalcLables.forEach((statement, index) => {
    it(`should assemble single line '${statementToString(statement)}'`, () => {
      const address = assemble({ statements: [statement], labels: {} })
      const opcodes = statementOpcodes[index] as number[]
      expect(address.slice(0, opcodes.length)).toStrictEqual(opcodes)
    })
  })

  it('should assemble code', () => {
    const address = assemble({ statements: statementsAfterCalcLables, labels })
    expect(address).toStrictEqual(assembledAddress)
  })
})