import { getDb } from "@/lib/db";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import type { Departamento, Usuario } from "@prisma/client";

// Departamentos onde o usuário é responsável (nível 1) e/ou diretor (nível
// 2) — ver DepartamentoInput em src/lib/departamentos.ts. As duas relações
// inversas de Usuario são Departamento[] (não um único departamento), então
// uma mesma pessoa pode gerir mais de um.
export async function listarDepartamentosGeridos(usuarioId: string): Promise<Departamento[]> {
  return getDb().departamento.findMany({
    where: { OR: [{ responsavelId: usuarioId }, { diretorId: usuarioId }] },
    orderBy: { nome: "asc" },
  });
}

// Usado tanto pela tela /departamento (guarda de acesso) quanto pela home
// (decidir se mostra o link "Solicitações do meu departamento") — null
// quando não está autenticado ou não é responsável/diretor de nenhum
// departamento.
export async function getGestorUsuario(): Promise<
  { usuario: Usuario; departamentos: Departamento[] } | null
> {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return null;
  }
  const departamentos = await listarDepartamentosGeridos(usuario.id);
  if (departamentos.length === 0) {
    return null;
  }
  return { usuario, departamentos };
}
