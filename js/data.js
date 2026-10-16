    // NÚMERO DO WHATSAPP DO ESTABELECIMENTO (Substituir com o DDD + Número real)
    let SALON_WHATSAPP = '5551997403703';

    // BASE DE DADOS DOS SERVIÇOS
    const SERVICES = [
      {
        id: 'unha-postica',
        name: 'Alongamento Postiça Realista',
        category: 'Unhas',
        duration: '2h00',
        price: 140.00,
        description: 'Soft gel com aspecto ultrafino e acabamento 100% natural. Perfeita para quem quer elegância imediata.',
        icon: 'fa-hand-sparkles',
        badge: 'Mais Pedido'
      },
      {
        id: 'unha-acrilico',
        name: 'Alongamento de Unhas Acrílico',
        category: 'Unhas',
        duration: '2h45',
        price: 210.00,
        description: 'Máxima durabilidade e resistência com estrutura impecável esculpida no molde.',
        icon: 'fa-gem'
      },
      {
        id: 'banho-gel',
        name: 'Banho de Gel',
        category: 'Unhas',
        duration: '1h45',
        price: 145.00,
        description: 'Camada protetora sobre as unhas naturais, garantindo brilho espelhado e fim das quebras.',
        icon: 'fa-wand-magic-sparkles'
      },
      {
        id: 'blindagem',
        name: 'Blindagem de Unhas',
        category: 'Unhas',
        duration: '1h15',
        price: 105.00,
        description: 'Camada de fortalecimento para manter seu esmalte intacto por até 20 dias.',
        icon: 'fa-shield-heart'
      },
      {
        id: 'cilios-volume',
        name: 'Cílios Volume Brasileiro',
        category: 'Cílios',
        duration: '1h30',
        price: 150.00,
        description: 'Fios em formato Y que proporcionam volume delicado, marcante e sem pesar o olhar.',
        icon: 'fa-eye'
      },
      {
        id: 'botox-capilar',
        name: 'Botox Capilar Hidratante',
        category: 'Cabelos',
        duration: '1h30',
        price: 170.00,
        description: 'Alinhamento dos fios, reposição de massa e brilho supremo com controle de frizz.',
        icon: 'fa-spray-can-sparkles'
      },
      {
        id: 'design-sobrancelha',
        name: 'Design de Sobrancelha com Henna',
        category: 'Sobrancelhas',
        duration: '45min',
        price: 65.00,
        description: 'Alinhamento geométrico respeitando a harmonia facial com pigmentação duradoura.',
        icon: 'fa-brush'
      },
      {
        id: 'buco-cera',
        name: 'Depilação de Buço com Cera',
        category: 'Sobrancelhas',
        duration: '15min',
        price: 20.00,
        description: 'Remoção rápida, suave e cuidadosa com cera hipoalergênica especial.',
        icon: 'fa-feather'
      },
      {
        id: 'massagem-relax',
        name: 'Massagem Relaxante & Drenante',
        category: 'Massagem',
        duration: '1h00',
        price: 130.00,
        description: 'Alívio de tensões, redução de inchaço e aromaterapia restauradora.',
        icon: 'fa-spa'
      }
    ];

    // PROFISSIONAIS DA EQUIPE
    const PROFESSIONALS = [
      {
        id: 'qualquer',
        name: 'Qualquer disponível',
        role: 'Primeiro horário livre',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
        isAny: true
      },
      {
        id: 'carol',
        name: 'Carol',
        role: 'Nail Designer Especialista',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'
      },
      {
        id: 'dani',
        name: 'Dani',
        role: 'Lash Designer & Sobrancelhas',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80'
      },
      {
        id: 'miria',
        name: 'Miriã',
        role: 'Terapeuta & Cabelos',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&h=150&q=80'
      }
    ];

    const AVAILABLE_HOURS = ['09:00', '10:30', '11:45', '13:30', '15:00', '16:30', '17:30', '18:45'];

