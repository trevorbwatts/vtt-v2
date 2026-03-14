import { ipcMain } from 'electron'
import { IPC } from './channels'
import type { BestiaryService } from '../services/bestiary.service'
import type { BestiaryEdition } from '../../renderer/src/types/bestiary.types'

export function registerBestiaryHandlers(bestiary: BestiaryService): void {
  ipcMain.handle(IPC.BESTIARY_GET_INDEX, () => bestiary.getIndex())

  ipcMain.handle(
    IPC.BESTIARY_GET_LETTER,
    (_e, letter: string, edition: BestiaryEdition) => bestiary.getByLetter(letter, edition)
  )

  ipcMain.handle(
    IPC.BESTIARY_GET_MONSTER,
    (_e, name: string, source: string) => bestiary.getMonster(name, source)
  )
}
