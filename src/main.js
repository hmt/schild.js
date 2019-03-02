'use strict'
import Knex from 'knex'
import { Model } from 'objection'
import * as Models from '../models/Models'

/*
Vorhandene Models:
Abschnitt, Fachklasse, Versetzung, Lehrer, Note, Fach, BKAbschluss,
BKAbschlussFach, AbiAbschluss, AbiAbschlussFach, FHRAbschluss,
FHRAbschlussFach, Sprachenfolge, FachGliederung, Vermerk, Schuelerfoto,
Schule, Nutzer
*/

export * from '../models/Models'
export default class Schild {
  constructor () {
    this.options = null
    this.knex = null
  }

  connect (knexConfig) {
    try {
      this.knex = Knex(knexConfig)
      Model.knex(this.knex)
      return this.knex
    } catch (e) {
      throw e
    }
  }

  disconnect () {
    if (this.knex) this.knex.destroy()
  }

  get models () {
    return Models
  }

  async testConnection () {
    try {
      await this.knex.raw('select 1+1 as result')
      console.log('Testverbindung konnte aufgebaut werden')
      return true
    }
    catch(err) {
      console.log(err)
      console.log('Testverbindung konnte nicht aufgebaut werden')
      return false
    }
  }

  async suche (pattern) {
    try {
      const schueler = await Models.Schueler.query()
      .where(function () {
        this.where('Geloescht', '-')
        .andWhere('Gesperrt', '-')
      })
      .andWhere(function () {
        this.where('Vorname', 'like', pattern + '%')
        .orWhere('Name', 'like', pattern + '%')
      })
      .select('Name', 'Vorname', 'Klasse', 'Status', 'AktSchuljahr', 'ID')
      .orderBy('AktSchuljahr', 'desc')
      .map(s => {
        return {
          value: `${s.Name}, ${s.Vorname} (${s.Klasse})`,
          status: s.Status,
          jahr: s.AktSchuljahr,
          id: s.ID
        }
      })
      const klasse = await Models.Versetzung.query()
      .where('Klasse', 'like', pattern + '%')
      .select('Klasse')
      .orderBy('Klasse', 'desc')
      .map(k => {
        return { value: k.Klasse, id: k.Klasse }
      })
      return schueler.concat(klasse)
    } catch (e) {
      throw e
    }
  }

  async getSchueler (id) {
    try {
      const res = await Models.Schueler.query()
      .where('ID', id)
      .eager(`[abschnitte.[noten.fach, lehrer],
              fachklasse.[fach_gliederungen], versetzung, bk_abschluss,
              bk_abschluss_faecher.fach, fhr_abschluss, fhr_abschluss_faecher.fach,
              abi_abschluss, abi_abschluss_faecher.fach, vermerke, sprachenfolgen]
            `)
      .modifyEager('abschnitte', builder => { builder.orderBy('ID') })
      .first()
      return res.toJSON()
    } catch (e) {
      throw e
    }
  }

  async getKlasse (klasse) {
    try {
      const res = await Models.Versetzung.query()
      .where('Klasse', klasse)
      .eager(`[schueler.[abschnitte.[noten.fach, lehrer],
              fachklasse.[fach_gliederungen], versetzung, bk_abschluss,
              bk_abschluss_faecher.fach, fhr_abschluss, fhr_abschluss_faecher.fach,
              abi_abschluss, abi_abschluss_faecher.fach, vermerke, sprachenfolgen], fachklasse,
              jahrgang]
            `)
      .modifyEager('schueler', builder => { builder.orderBy('Name') })
      .first()
      return res.toJSON()
    } catch (e) {
      throw e
    }
  }

  async getSchule () {
    try {
      const res = await Models.Schule.query().first()
      delete res.SchulLogo
      delete res.Einstellungen
      delete res.Einstellungen2
      return res.toJSON()
    } catch (e) {
      throw e
    }
  }

  async getSchuelerfoto (id) {
    try {
      const data = await Models.Schuelerfoto.query()
      .where('Schueler_ID', id)
      .first()
      return Buffer.from(data.Foto, 'binary').toString('base64')
    } catch (e) {
      throw e
    }
  }

  async getNutzer (username) {
    try {
      const res = await Models.Nutzer.query()
      .where('US_LoginName', username)
      .first()
      return res.toJSON()
    } catch (e) {
      throw e
    }
  }
}
