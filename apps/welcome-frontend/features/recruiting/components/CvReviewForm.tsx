// features/recruiting/components/CvReviewForm.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { ExtractedCvData } from '../services/recruiting.service'
import {
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  GraduationCap,
  Languages,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react'

interface CvReviewFormProps {
  data: ExtractedCvData
  onSave: (updatedData: ExtractedCvData) => void
}

export function CvReviewForm({ data, onSave }: CvReviewFormProps) {
  // Rendiamo lo stato locale mutabile così il recruiter può correggere eventuali sviste dell'AI
  const [formData, setFormData] = useState<ExtractedCvData>(data)

  // Se l'utente cambia candidato a sinistra, resettiamo il form con i nuovi dati
  useEffect(() => {
    setFormData(data)
  }, [data])

  const handlePersonalChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalData: { ...prev.personalData, [field]: value },
    }))
  }

  // --- LOGICA EDITING LIVE PER GLI ARRAY (Esperienze, Formazione, Skill) ---
  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...formData.experience]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev) => ({ ...prev, experience: updated }))
  }

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...formData.education]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev) => ({ ...prev, education: updated }))
  }

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-8 pb-20">
      {/* SEZIONE 1: ANAGRAFICA CANDIDATO */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
          <div className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
              Dati Personali
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
            <Sparkles className="size-3" /> Confermato da AI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">Nome e Cognome</label>
            <input
              type="text"
              value={formData.personalData.fullName}
              onChange={(e) => handlePersonalChange('fullName', e.target.value)}
              className="w-full text-sm font-medium border border-zinc-200 rounded-lg px-3 py-2 bg-zinc-50/30 focus:border-primary focus:bg-white focus:outline-hidden transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="email"
                value={formData.personalData.email || ''}
                onChange={(e) => handlePersonalChange('email', e.target.value)}
                placeholder="Nessuna email trovata"
                className="w-full text-sm pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:border-red-600 focus:outline-hidden transition"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">Telefono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="text"
                value={formData.personalData.phone || ''}
                onChange={(e) => handlePersonalChange('phone', e.target.value)}
                placeholder="Nessun telefono trovato"
                className="w-full text-sm pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:border-red-600 focus:outline-hidden transition"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">
              Località / Residenza
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="text"
                value={formData.personalData.location || ''}
                onChange={(e) => handlePersonalChange('location', e.target.value)}
                placeholder="Nessuna località trovata"
                className="w-full text-sm pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:border-red-600 focus:outline-hidden transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: ESPERIENZE LAVORATIVE */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="size-5 text-primary" />
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
              Esperienza Lavorativa
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {formData.experience.map((exp, idx) => (
            <div
              key={idx}
              className="group p-4 border border-zinc-100 bg-zinc-50/20 hover:bg-zinc-50/40 rounded-xl space-y-3 relative transition"
            >
              <button
                onClick={() => removeExperience(idx)}
                className="absolute right-3 top-3 p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Ruolo / Qualifica
                  </label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Azienda
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Periodo
                  </label>
                  <input
                    type="text"
                    value={exp.period || ''}
                    onChange={(e) => updateExperience(idx, 'period', e.target.value)}
                    placeholder="Es: 2021 - 2023"
                    className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Mansioni e Attività svolte
                </label>
                <textarea
                  value={exp.description || ''}
                  rows={2}
                  onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEZIONE 3: ISTRUZIONE E FORMAZIONE */}
      <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
              Istruzione e Formazione
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {formData.education.map((edu, idx) => (
            <div
              key={idx}
              className="group p-4 border border-zinc-100 bg-zinc-50/20 hover:bg-zinc-50/40 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 relative transition"
            >
              <button
                onClick={() => removeEducation(idx)}
                className="absolute right-3 top-3 p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Titolo di Studio / Corso
                </label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Istituto / Università
                </label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">
                  Anno e Voto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={edu.year || ''}
                    placeholder="Anno"
                    onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                    className="w-1/2 text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 text-center focus:border-red-600 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={edu.grade || ''}
                    placeholder="Voto"
                    onChange={(e) => updateEducation(idx, 'grade', e.target.value)}
                    className="w-1/2 text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 text-center focus:border-red-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEZIONE 4: COMPETENZE & LINGUE (Inline Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SKILLS */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-xs space-y-3">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Hard & Soft Skills Estratte
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, i) => (
              <span
                key={i}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium px-2.5 py-1 rounded-md transition cursor-default"
              >
                {skill}
              </span>
            ))}
            {formData.skills.length === 0 && (
              <span className="text-xs text-zinc-400 italic">Nessuna skill rilevata</span>
            )}
          </div>
        </div>

        {/* LINGUE */}
        <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-2">
            <Languages className="size-4 text-zinc-400" />
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              Competenze Linguistiche
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.languages.map((lang, i) => (
              <span
                key={i}
                className="text-xs bg-red-50 text-red-900 border border-red-100 font-semibold px-2.5 py-1 rounded-md"
              >
                {lang}
              </span>
            ))}
            {formData.languages.length === 0 && (
              <span className="text-xs text-zinc-400 italic">
                Nessuna lingua rilevata
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FLOAT BAR DI SALVATAGGIO DEFINITIVO */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4 flex justify-end border-t border-zinc-100 backdrop-blur-md">
        <button
          onClick={() => onSave(formData)}
          className="w-full md:w-auto px-8 py-3 bg-red-700 text-white text-sm font-bold rounded-xl hover:bg-red-800 hover:scale-[1.01] active:scale-[0.99] transition shadow-md shadow-red-700/10"
        >
          Conferma e Salva in ATS ADHR
        </button>
      </div>
    </div>
  )
}
