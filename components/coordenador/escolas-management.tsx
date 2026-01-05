"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, School as SchoolIcon } from "lucide-react"
import { listSchools, createSchool, updateSchool, deleteSchool, type School, type CreateSchoolInput, type UpdateSchoolInput } from "@/lib/api"

export function EscolasManagement() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [timezone, setTimezone] = useState("America/Sao_Paulo")
  const [logoUrl, setLogoUrl] = useState("")
  const [address, setAddress] = useState({
    country: "Brazil",
    state: "",
    city: "",
    neighborhood: "",
    street: "",
    number: "",
    referencePoint: "",
    zipCode: "",
  })

  useEffect(() => {
    loadSchools()
  }, [])

  const loadSchools = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await listSchools({ page: 1, limit: 100 })
      setSchools(response.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar escolas")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (school?: School) => {
    if (school) {
      setEditingSchool(school)
      setName(school.name)
      setTimezone(school.timezone || "America/Sao_Paulo")
      setLogoUrl(school.logoUrl || "")
      if (school.address) {
        setAddress({
          country: school.address.country || "Brazil",
          state: school.address.state || "",
          city: school.address.city || "",
          neighborhood: school.address.neighborhood || "",
          street: school.address.street || "",
          number: school.address.number || "",
          referencePoint: school.address.referencePoint || "",
          zipCode: school.address.zipCode || "",
        })
      }
    } else {
      setEditingSchool(null)
      resetForm()
    }
    setShowDialog(true)
  }

  const resetForm = () => {
    setName("")
    setTimezone("America/Sao_Paulo")
    setLogoUrl("")
    setAddress({
      country: "Brazil",
      state: "",
      city: "",
      neighborhood: "",
      street: "",
      number: "",
      referencePoint: "",
      zipCode: "",
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nome da escola é obrigatório")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingSchool) {
        const updateData: UpdateSchoolInput = {
          name: name.trim(),
          timezone: timezone || undefined,
          logoUrl: logoUrl.trim() || undefined,
          address: {
            country: address.country,
            state: address.state,
            city: address.city,
            neighborhood: address.neighborhood || undefined,
            street: address.street,
            number: address.number,
            referencePoint: address.referencePoint || undefined,
            zipCode: address.zipCode,
          },
        }
        await updateSchool(editingSchool.id, updateData)
      } else {
        const createData: CreateSchoolInput = {
          name: name.trim(),
          timezone: timezone || undefined,
          logoUrl: logoUrl.trim() || undefined,
          address: {
            country: address.country,
            state: address.state,
            city: address.city,
            neighborhood: address.neighborhood || undefined,
            street: address.street,
            number: address.number,
            referencePoint: address.referencePoint || undefined,
            zipCode: address.zipCode,
          },
        }
        await createSchool(createData)
      }
      
      // Fechar dialog e atualizar lista após criar ou editar
      setShowDialog(false)
      resetForm()
      loadSchools()
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar escola")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (school: School) => {
    if (!confirm(`Tem certeza que deseja desativar a escola "${school.name}"?`)) {
      return
    }

    try {
      await deleteSchool(school.id)
      loadSchools()
    } catch (err: any) {
      setError(err?.message || "Erro ao deletar escola")
    }
  }

  const handleShowStudents = (school: School) => {
    router.push(`/coordenador/turmas/${school.id}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escola
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escolas</CardTitle>
          <CardDescription>
            Clique em uma escola para gerenciar suas turmas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <div className="text-center py-12">
              <SchoolIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Nenhuma escola cadastrada</p>
              <p className="text-xs text-muted-foreground">
                Clique em "Nova Escola" para cadastrar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.map((school) => (
                <Card
                  key={school.id}
                  className="cursor-pointer hover:border-primary transition-colors relative group"
                  onClick={() => handleShowStudents(school)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <SchoolIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                            {school.name}
                          </h3>
                          {school.address && (
                            <p className="text-xs text-muted-foreground">
                              {school.address.city}, {school.address.state}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDialog(school)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(school)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchool ? "Editar Escola" : "Nova Escola"}</DialogTitle>
            <DialogDescription>
              {editingSchool ? "Atualize as informações da escola" : "Preencha os dados da nova escola"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Escola *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Escola Estadual João da Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL do Logo</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Endereço</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Input
                    id="country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={address.neighborhood}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={address.number}
                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referencePoint">Ponto de Referência</Label>
                  <Input
                    id="referencePoint"
                    value={address.referencePoint}
                    onChange={(e) => setAddress({ ...address, referencePoint: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
