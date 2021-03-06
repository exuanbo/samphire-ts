import React from 'react'
import Headbar from './Headbar'
import CodeArea from './CodeArea'
import IODevices from './IODevices'
import CPURegisters from './CPURegisters'
import Memory from './Memory'
import Tokens from './Tokens'

const App: React.FC = () => (
  <div className="flex flex-col w-screen h-screen divide-y">
    <Headbar className="flex-none" />
    <div className="flex h-full divide-x">
      <CodeArea className="flex-1" />
      <div className="flex-1 divide-y">
        <IODevices />
        <CPURegisters />
        <Memory />
        <Tokens />
      </div>
    </div>
  </div>
)

export default App
