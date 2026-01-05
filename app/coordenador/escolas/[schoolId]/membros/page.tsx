"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Users, Loader2, AlertCircle, Plus, Trash2, Search, GraduationCap, UserCog, User } from "lucide-react"
import { getSchoolById, listUsersBySchoolFromAPI, addUserToSchool, removeUserFromSchool, getRoles, listAllUsers, listClasses, removeUserFromClass, setUserRole, listClassesByUser, getUserRole, type School, type UserSchool, type Role, type UserClassUser } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Label } from "@/components/ui/label"
import { formatGrade, formatRoleName } from "@/lib/utils"

export default function EscolaMembrosPage() {
  const { currentUser } = useAuth()
  const params = useParams()
  const router = useRouter()
  const schoolIdParam = params?.schoolId as string
  const schoolId = schoolIdParam ? parseInt(schoolIdParam) : NaN

  const [school, setSchool] = useState<School | null>(null)
  const [members, setMembers] = useState<UserSchool[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<UserSchool | null>(null)
  const [userId, setUserId] = useState("")
  const [roleId, setRoleId] = useState<string>("")
  const [saving, setSaving] = useState(false)
  
  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [allUsers, setAllUsers] = useState<UserClassUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const loadingRef = useRef(false)
  const loadedSchoolIdRef = useRef<number | null>(null)
  const loadingMembersRef = useRef(false)
  const loadedMembersSchoolIdRef = useRef<number | null>(null)
  const loadingUsersRef = useRef(false)
  const loadedUsersRef = useRef(false)

  const loadSchoolData = useCallback(async () => {
    if (!schoolId || isNaN(schoolId) || loadingRef.current) return

    if (loadedSchoolIdRef.current === schoolId) {
      return
    }

    try {
      loadingRef.current = true
      loadedSchoolIdRef.current = schoolId
      setLoading(true)
      setError(null)
      const schoolData = await getSchoolById(schoolId)
      setSchool(schoolData)
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados da escola")
      loadedSchoolIdRef.current = null
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [schoolId])

  // Função para validar se os membros ainda estão na escola
  const validateMembersInSchool = useCallback(async (members: UserSchool[], targetSchoolId: number): Promise<UserSchool[]> => {
    const validatedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          // Verificar se o usuário ainda está na escola usando getUserRole
          await getUserRole(member.userId, targetSchoolId)
          return member
        } catch (err: any) {
          // Se retornar 404 ou outro erro, o usuário não está mais na escola
          console.debug(`Usuário ${member.userId} não está mais na escola ${targetSchoolId}:`, err)
          return null
        }
      })
    )
    return validatedMembers.filter((member): member is UserSchool => member !== null)
  }, [])

  const loadMembers = useCallback(async (forceReload = false) => {
    if (!schoolId || isNaN(schoolId) || loadingMembersRef.current) return

    if (!forceReload && loadedMembersSchoolIdRef.current === schoolId) {
      return
    }

    try {
      loadingMembersRef.current = true
      loadedMembersSchoolIdRef.current = schoolId
      setLoadingMembers(true)
      setError(null)
      
      const allMembers: UserSchool[] = []
      let currentPage = 1
      const limit = 100
      let hasMorePages = true

      while (hasMorePages) {
        const response = await listUsersBySchoolFromAPI(schoolId, {
          page: currentPage,
          limit,
          search: searchTerm || undefined,
        })

        if (response.data && response.data.length > 0) {
          allMembers.push(...response.data)
        }

        hasMorePages = currentPage < (response.meta?.totalPages || 0)
        currentPage++
      }

      // Validar que cada membro ainda está na escola
      const validMembers = await validateMembersInSchool(allMembers, schoolId)
      
      setMembers(validMembers)
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar membros")
      setMembers([])
      loadedMembersSchoolIdRef.current = null
    } finally {
      setLoadingMembers(false)
      loadingMembersRef.current = false
    }
  }, [schoolId, searchTerm, validateMembersInSchool])

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await getRoles()
      setRoles(rolesData || [])
    } catch (err: any) {
      console.error("Erro ao carregar roles:", err)
    }
  }, [])

  const loadAllUsers = useCallback(async () => {
    if (loadingUsersRef.current || loadedUsersRef.current) return
    
    try {
      loadingUsersRef.current = true
      setLoadingUsers(true)
      
      console.log("🔍 Carregando todos os usuários do sistema...")
      
      // Buscar todos os usuários, incluindo os sem escola
      // A função listAllUsers deve retornar todos os usuários do sistema
      const users = await listAllUsers({ page: 1, limit: 100 })
      
      // Garantir que temos um array válido
      const usersArray = Array.isArray(users) ? users : []
      
      console.log(`📊 Total de usuários carregados: ${usersArray.length}`)
      console.log("👥 Usuários por categoria:")
      
      const usersWithoutSchool = usersArray.filter(u => !u.roles || u.roles.length === 0)
      const usersWithSchool = usersArray.filter(u => u.roles && u.roles.length > 0)
      
      console.log(`  - Sem escola: ${usersWithoutSchool.length}`)
      console.log(`  - Com escola: ${usersWithSchool.length}`)
      
      if (usersWithoutSchool.length > 0) {
        console.log("🆓 Usuários sem escola:", usersWithoutSchool.map(u => `${u.firstName} ${u.lastName} (${u.email})`))
      }
      
      setAllUsers(usersArray)
      loadedUsersRef.current = true
    } catch (err: any) {
      console.error("❌ Erro ao carregar usuários:", err)
      setAllUsers([])
      // Resetar o flag para permitir nova tentativa
      loadedUsersRef.current = false
    } finally {
      setLoadingUsers(false)
      loadingUsersRef.current = false
    }
  }, [])

  // Organizar membros por tipo
  const organizedMembers = useMemo(() => {
    const students: UserSchool[] = []
    const teachers: UserSchool[] = []
    const coordinators: UserSchool[] = []
    const others: UserSchool[] = []

    members.forEach((member) => {
      const roleName = member.role?.name?.toLowerCase() || ""
      if (roleName.includes("aluno") || roleName.includes("student") || roleName.includes("estudante")) {
        students.push(member)
      } else if (roleName.includes("professor") || roleName.includes("teacher")) {
        teachers.push(member)
      } else if (roleName.includes("coordenador") || roleName.includes("coordinator")) {
        coordinators.push(member)
      } else {
        others.push(member)
      }
    })

    return { students, teachers, coordinators, others }
  }, [members])

  // Filtrar membros por aba ativa
  const filteredMembers = useMemo(() => {
    switch (activeTab) {
      case "students":
        return organizedMembers.students
      case "teachers":
        return organizedMembers.teachers
      case "coordinators":
        return organizedMembers.coordinators
      default:
        return members
    }
  }, [activeTab, organizedMembers, members])

  const availableUsers = useMemo(() => {
    console.log(`🔍 Filtrando usuários disponíveis para escola ${schoolId}`)
    console.log(`📊 Total de usuários: ${allUsers.length}`)
    console.log(`👥 Membros atuais da escola: ${members.length}`)
    
    // Filtrar usuários que não estão na escola atual
    // Isso inclui:
    // - Usuários sem escola (não têm nenhuma role ou roles vazias)
    // - Usuários de outras escolas (têm role com schoolId diferente do atual)
    const membersInSchoolIds = new Set(members.map(m => m.userId))
    
    const filtered = allUsers.filter(user => {
      // Excluir usuários que já estão na escola atual
      const isInCurrentSchool = membersInSchoolIds.has(user.userId)
      if (isInCurrentSchool) {
        console.log(`❌ Usuário ${user.firstName} ${user.lastName} já está na escola`)
        return false
      }
      
      // Incluir usuários sem escola (sem roles ou roles vazias)
      if (!user.roles || user.roles.length === 0) {
        console.log(`✅ Usuário ${user.firstName} ${user.lastName} sem escola - DISPONÍVEL`)
        return true
      }
      
      // Incluir usuários que têm roles apenas em outras escolas (não na atual)
      const hasRoleInCurrentSchool = user.roles.some(role => role.schoolId === schoolId)
      if (!hasRoleInCurrentSchool) {
        console.log(`✅ Usuário ${user.firstName} ${user.lastName} de outra escola - DISPONÍVEL`)
        return true
      }
      
      console.log(`❌ Usuário ${user.firstName} ${user.lastName} já tem role na escola atual`)
      return false
    })
    
    console.log(`📋 Usuários disponíveis após filtro: ${filtered.length}`)
    
    if (!userSearchQuery.trim()) {
      return filtered
    }

    const term = userSearchQuery.toLowerCase().trim()
    const searchFiltered = filtered.filter((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
      const email = (user.email || "").toLowerCase()
      const matches = fullName.includes(term) || email.includes(term)
      if (matches) {
        console.log(`🔍 Usuário ${user.firstName} ${user.lastName} corresponde à busca "${term}"`)
      }
      return matches
    })
    
    console.log(`🔍 Usuários após busca "${term}": ${searchFiltered.length}`)
    return searchFiltered
  }, [allUsers, members, userSearchQuery, schoolId])

  useEffect(() => {
    if (currentUser && schoolId && !isNaN(schoolId) && schoolId > 0) {
      loadSchoolData()
      loadMembers()
      loadRoles()
    } else if (schoolIdParam && (isNaN(schoolId) || schoolId <= 0)) {
      setError("ID da escola inválido")
      setLoading(false)
    }
    
    return () => {
      if (loadedSchoolIdRef.current !== schoolId) {
        loadedSchoolIdRef.current = null
        loadingRef.current = false
      }
      if (loadedMembersSchoolIdRef.current !== schoolId) {
        loadedMembersSchoolIdRef.current = null
        loadingMembersRef.current = false
      }
    }
  }, [currentUser, schoolId, schoolIdParam, loadSchoolData, loadMembers, loadRoles])

  useEffect(() => {
    if (schoolId && !isNaN(schoolId) && schoolId > 0) {
      const timeoutId = setTimeout(() => {
        loadedMembersSchoolIdRef.current = null
        loadMembers()
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, schoolId, loadMembers])

  const handleOpenAddDialog = () => {
    setUserId("")
    setUserSearchQuery("")
    setRoleId("")
    setShowAddDialog(true)
    setShowUserDropdown(false)
    if (!loadedUsersRef.current) {
      loadAllUsers()
    }
  }

  const handleOpenRemoveDialog = (member: UserSchool) => {
    setSelectedMember(member)
    setShowRemoveDialog(true)
  }

  const handleAddMember = async () => {
    if (!userId.trim() || !roleId) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await addUserToSchool({
        userId: userId.trim(),
        schoolId: schoolId,
        roleId: parseInt(roleId),
      })
      
      setShowAddDialog(false)
      setUserId("")
      setUserSearchQuery("")
      setRoleId("")
      
      loadedMembersSchoolIdRef.current = null
      loadedUsersRef.current = false
      await loadMembers()
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar membro à escola")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    setSaving(true)
    setError(null)

    try {
      // 1. Verificar em quais turmas o usuário está realmente matriculado
      try {
        // Primeiro, buscar todas as turmas do usuário
        const userClassesResponse = await listClassesByUser(selectedMember.userId, {
          page: 1,
          limit: 100,
        })
        
        const userClasses = userClassesResponse.data || []
        
        // Filtrar apenas as turmas que pertencem à escola atual
        const classesInSchool = userClasses.filter((cls) => cls.schoolId === schoolId)
        
        // Remover o usuário apenas das turmas onde ele está realmente matriculado
        if (classesInSchool.length > 0) {
          const removeFromClassPromises = classesInSchool.map((cls) =>
            removeUserFromClass(selectedMember.userId, cls.id).catch((err) => {
              // Ignorar erros 404 silenciosamente (usuário já não está na turma)
              if (err?.status !== 404) {
                console.warn(`Erro ao remover usuário da turma ${cls.id}:`, err)
              }
              return null
            })
          )
          
          await Promise.allSettled(removeFromClassPromises)
        }
      } catch (classErr: any) {
        // Se houver erro ao buscar turmas do usuário, apenas loga mas continua
        // Pode ser que o usuário não esteja em nenhuma turma
        console.warn("Erro ao buscar turmas do usuário:", classErr)
      }
      
      // 2. Remover o usuário da escola
      console.log(`Removendo usuário ${selectedMember.userId} da escola ${schoolId}`)
      const removeResponse = await removeUserFromSchool(selectedMember.userId, schoolId)
      console.log("Resposta da remoção:", removeResponse)
      
      // Nota: Não tentamos setar a role após remover da escola, pois isso poderia
      // recriar o vínculo do usuário com a escola, anulando a remoção.
      
      setShowRemoveDialog(false)
      setSelectedMember(null)
      
      // Forçar recarregamento dos membros (ignorar cache)
      loadedMembersSchoolIdRef.current = null
      await loadMembers(true)
    } catch (err: any) {
      console.error("Erro ao remover membro da escola:", err)
      console.error("Detalhes do erro:", {
        status: err?.status || err?.response?.status,
        message: err?.message || err?.response?.data?.message,
        userId: selectedMember?.userId,
        schoolId: schoolId,
      })
      setError(err?.message || err?.response?.data?.message || "Erro ao remover membro da escola")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados da escola...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !school) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/coordenador/turmas/${schoolId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {school?.name || "Escola"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Membros da escola
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Membros ({members.length})
              </CardTitle>
              <CardDescription>
                Gerencie alunos, professores e coordenadores da escola
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pb-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  Todos ({members.length})
                </TabsTrigger>
                <TabsTrigger value="students">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Alunos ({organizedMembers.students.length})
                </TabsTrigger>
                <TabsTrigger value="teachers">
                  <UserCog className="h-4 w-4 mr-2" />
                  Professores ({organizedMembers.teachers.length})
                </TabsTrigger>
                <TabsTrigger value="coordinators">
                  <User className="h-4 w-4 mr-2" />
                  Coordenadores ({organizedMembers.coordinators.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "Nenhum membro encontrado" : "Nenhum membro cadastrado nesta escola"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>{formatRoleName(member.role?.name) || "-"}</TableCell>
                      <TableCell>{formatGrade(member.grade) || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRemoveDialog(member)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro à Escola</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um membro à escola
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userSearch">Buscar Usuário *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="userSearch"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value)
                    setShowUserDropdown(true)
                    if (!e.target.value) {
                      setUserId("")
                    }
                  }}
                  onFocus={() => {
                    setShowUserDropdown(true)
                    if (!loadedUsersRef.current) {
                      loadAllUsers()
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowUserDropdown(false), 200)
                  }}
                  placeholder="Digite o nome ou email do usuário..."
                  className="pl-10"
                />
                {showUserDropdown && (
                  <div className="absolute z-[30] w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando usuários...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        {userSearchQuery 
                          ? "Nenhum usuário encontrado com o termo de busca" 
                          : "Digite para buscar um usuário"}
                      </div>
                    ) : (
                      <div className="py-1">
                        {availableUsers.map((user) => (
                          <div
                            key={user.userId}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault()
                            }}
                            onClick={() => {
                              setUserId(user.userId)
                              setUserSearchQuery(`${user.firstName} ${user.lastName}`)
                              setShowUserDropdown(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {userId && (
                <p className="text-sm text-muted-foreground">
                  Usuário selecionado: {allUsers.find(u => u.userId === userId)?.firstName} {allUsers.find(u => u.userId === userId)?.lastName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Função *</Label>
              <select
                id="roleId"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma função</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id.toString()}>
                    {formatRoleName(role.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro da Escola</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              {selectedMember
                ? `${selectedMember.user.firstName} ${selectedMember.user.lastName}`
                : "este membro"}{" "}
              da escola? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
