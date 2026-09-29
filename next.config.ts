import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão do Next é 1 MB — baixo demais pra este app: quase todo
      // formulário de solicitação exige anexar nota fiscal/comprovante, às
      // vezes mais de um de uma vez (ex.: nota + boleto), e uma foto de
      // celular ou um PDF escaneado passa de 1 MB com facilidade. 10 MB
      // cobre isso com folga sem abrir demais pra um uso indevido, já que é
      // uma ferramenta interna (login obrigatório via Microsoft Entra), não
      // um formulário público.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
