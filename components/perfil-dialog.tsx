"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FaSpinner, FaUser, FaCheckCircle, FaExclamationCircle } from "react-icons/fa"
import { getRoles, getUserRole, setUserRole, type Role, type UserSchool } from "@/lib/api/roles"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getRouteByRole } from "@/lib/utils/role-redirect"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PerfilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PerfilDialog({ open, onOpenChange }: PerfilDialogProps) {
  const { currentUser, logout } = useAuth()
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loadingUserRole, setLoadingUserRole] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [currentUserRole, setCurrentUserRole] = useState<UserSchool | null>(null)

  // Carregar roles disponíveis
  useEffect(() => {
    if (open) {
      loadRoles()
    }
  }, [open])

  // Carregar role atual do usuário quando abrir o diálogo
  useEffect(() => {
    if (open && currentUser) {
      loadUserRole()
    } else {
      setCurrentUserRole(null)
      setSelectedRoleId("")
    }
  }, [open, currentUser])

  const loadRoles = async () => {
    setLoadingRoles(true)
    setError(null)
    try {
      const rolesData = await getRoles()
      setRoles(rolesData)
      // Se não há role selecionada e há roles disponíveis, seleciona a primeira
      if (!selectedRoleId && rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id.toString())
      }
    } catch (err: any) {
      console.error("Erro ao carregar roles:", err)
      setError(err.message || "Erro ao carregar roles")
      // Não bloqueia a interface se houver erro - permite tentar novamente
    } finally {
      setLoadingRoles(false)
    }
  }

  const loadUserRole = async () => {
    if (!currentUser) return
    
    setLoadingUserRole(true)
    setError(null)
    try {
      const userRoleData = await getUserRole(currentUser.uid, 1) // Fixo como 1
      setCurrentUserRole(userRoleData)
      setSelectedRoleId(userRoleData.roleId.toString())
    } catch (err: any) {
      // Se não encontrar, não é erro - usuário pode não ter role ainda
      if (err.status !== 404) {
        setError(err.message || "Erro ao carregar role do usuário")
      }
      setCurrentUserRole(null)
      setSelectedRoleId("")
    } finally {
      setLoadingUserRole(false)
    }
  }

  const handleSave = async () => {
    if (!currentUser || !selectedRoleId) {
      setError("Selecione uma role")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await setUserRole({
        userId: currentUser.uid,
        schoolId: 1, // Fixo como 1
        roleId: parseInt(selectedRoleId),
      })
      
      setCurrentUserRole(result)
      setSuccess(true)
      
      // Redirecionar após salvar baseado na role
      const roleName = result.role?.name
      const redirectRoute = getRouteByRole(roleName)
      
      setTimeout(() => {
        onOpenChange(false)
        router.push(redirectRoute)
      }, 1000)
    } catch (err: any) {
      // Se for erro 404 (recurso não encontrado), fazer logout e redirecionar para login
      if (err?.status === 404 || err?.response?.status === 404) {
        await logout()
        router.push("/auth")
        return
      }
      setError(err.message || "Erro ao salvar role")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaUser className="h-5 w-5" />
            Meu Perfil
          </DialogTitle>
          <DialogDescription>
            Visualize e altere sua role na escola
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do usuário */}
          {currentUser && (
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p className="text-sm font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p className="text-xs font-mono text-muted-foreground break-all">{currentUser.uid}</p>
                </div>
              </div>
            </div>
          )}

          {/* Campo de School ID - Fixo como 1 */}
          <div className="space-y-2">
            <Label htmlFor="schoolId">School ID</Label>
            <Input
              id="schoolId"
              type="number"
              value="1"
              disabled
              className="bg-muted"
            />
          </div>

          {/* Loading da role atual */}
          {loadingUserRole && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FaSpinner className="h-4 w-4 animate-spin" />
              <span>Carregando role atual...</span>
            </div>
          )}

          {/* Role atual */}
          {currentUserRole && !loadingUserRole && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Label className="text-xs text-muted-foreground mb-2 block">Role Atual</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  {currentUserRole.role?.name || `Role ID: ${currentUserRole.roleId}`}
                </Badge>
                {currentUserRole.role?.description && (
                  <span className="text-xs text-muted-foreground">
                    {currentUserRole.role.description}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mensagem quando não há role */}
          {!currentUserRole && !loadingUserRole && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <FaExclamationCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs text-yellow-700 dark:text-yellow-300 mb-1 block font-medium">
                    Nenhuma role associada
                  </Label>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Selecione uma role abaixo para associar ao seu usuário.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="role">
                {currentUserRole ? "Alterar Role" : "Selecionar Role"}
              </Label>
              {error && roles.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadRoles}
                  disabled={loadingRoles}
                  className="h-7 text-xs"
                >
                  {loadingRoles ? (
                    <FaSpinner className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Tentar novamente
                </Button>
              )}
            </div>
            {loadingRoles ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <FaSpinner className="h-4 w-4 animate-spin" />
                <span>Carregando roles...</span>
              </div>
            ) : roles.length === 0 ? (
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-2">
                  {error ? "Erro ao carregar roles" : "Nenhuma role disponível"}
                </p>
                {error && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadRoles}
                    disabled={loadingRoles}
                    className="w-full"
                  >
                    {loadingRoles ? (
                      <>
                        <FaSpinner className="h-3 w-3 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Tentar carregar novamente"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={saving}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione uma role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <FaExclamationCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
              <FaCheckCircle className="h-4 w-4 shrink-0" />
              <span>Role atualizada com sucesso!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Fechar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedRoleId || loadingRoles || loadingUserRole}
          >
            {saving ? (
              <>
                <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : currentUserRole ? (
              "Atualizar Role"
            ) : (
              "Associar Role"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

