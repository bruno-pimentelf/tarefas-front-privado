"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Loader2, AlertCircle, Users, GraduationCap } from "lucide-react"
import { listClasses, listUsersByClass, addUserToClass, removeUserFromClass, listClassesByUser, type Class } from "@/lib/api"
import { type UserClassUser } from "@/lib/api/user-class"

export function RelacoesManagement() {
  const [classes, setClasses] = useState<Class[]>([])
  const [users, setUsers] = useState<UserClassUser[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [viewMode, setViewMode] = useState<"by-class" | "by-user">("by-class")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (viewMode === "by-class" && selectedClassId) {
      loadUsersByClass(parseInt(selectedClassId))
    } else if (viewMode === "by-user" && selectedUserId) {
      loadClassesByUser(selectedUserId)
    }
  }, [viewMode, selectedClassId, selectedUserId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const classesResponse = await listClasses({ page: 1, limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } }))
      setClasses(classesResponse.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const loadUsersByClass = async (classId: number) => {
    try {
      setLoading(true)
      const response = await listUsersByClass(classId, { page: 1, limit: 100 })
      setUsers(response.data || [])
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const loadClassesByUser = async (userId: string) => {
    try {
      setLoading(true)
      const response = await listClassesByUser(userId, { page: 1, limit: 100 })
      // Convert classes to users format for display
      setUsers([])
      // TODO: Implement proper display for classes by user
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar turmas")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUserToClass = async () => {
    if (!selectedClassId || !selectedUserId) {
      setError("Selecione uma turma e um usuário")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await addUserToClass({
        userId: selectedUserId,
        classId: parseInt(selectedClassId),
      })
      setSelectedUserId("")
      if (viewMode === "by-class") {
        loadUsersByClass(parseInt(selectedClassId))
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar usuário à turma")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveUserFromClass = async (userId: string, classId: number) => {
    if (!confirm("Tem certeza que deseja remover este usuário da turma?")) {
      return
    }

    try {
      await removeUserFromClass(userId, classId)
      if (viewMode === "by-class") {
        loadUsersByClass(classId)
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao remover usuário da turma")
    }
  }

  // Get all users from all classes for the user selector
  const getAllUsers = async () => {
    // This would need to be implemented - for now, we'll use the users from the selected class
    return users
  }

  if (loading && !selectedClassId && !selectedUserId) {
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
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "by-class" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("by-class")
              setSelectedUserId("")
              setUsers([])
            }}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Por Turma
          </Button>
          <Button
            variant={viewMode === "by-user" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("by-user")
              setSelectedClassId("")
              setUsers([])
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Por Usuário
          </Button>
        </div>
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

      {viewMode === "by-class" ? (
        <>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Turma</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} - {cls.school?.name || cls.schoolName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClassId && (
                <div className="space-y-2">
                  <Label>Adicionar Usuário à Turma</Label>
                  <div className="flex gap-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Load all users for selection */}
                        <SelectItem value="mock-user-1">Usuário 1</SelectItem>
                        <SelectItem value="mock-user-2">Usuário 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddUserToClass} disabled={saving || !selectedUserId}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedClassId && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum usuário nesta turma
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.roles.map((role) => role.roleName).join(", ")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUserFromClass(user.userId, parseInt(selectedClassId))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Visualização por usuário será implementada em breve
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
