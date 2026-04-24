import { supabase } from '../lib/supabase.js'

function buildDefaultFamilyName(user) {
  const nickname = String(user?.nickname || '').trim()
  return nickname ? `${nickname}的家庭` : '我的家庭'
}

async function getFamilyById(familyId) {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function getCurrentFamilyBundle(userId) {
  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member) return null

  const family = await getFamilyById(member.family_id)
  if (!family) return null

  return { family, member }
}

export async function ensureDefaultFamilyForUser(user) {
  const existing = await getCurrentFamilyBundle(user.id)
  if (existing) return existing

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert([{
      name: buildDefaultFamilyName(user),
      owner_user_id: user.id,
      status: 'active'
    }])
    .select('*')
    .single()

  if (familyError || !family) {
    throw familyError || new Error('Failed to create family')
  }

  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .insert([{
      family_id: family.id,
      user_id: user.id,
      role: 'owner',
      relation: '自己',
      status: 'active'
    }])
    .select('*')
    .single()

  if (memberError || !member) {
    throw memberError || new Error('Failed to create family member')
  }

  await backfillUserFamilyData(user.id, family.id)

  return { family, member }
}

export async function getCurrentFamilyOrThrow(user) {
  const bundle = await ensureDefaultFamilyForUser(user)
  if (!bundle?.family || !bundle?.member) {
    throw new Error('Family not found')
  }
  return bundle
}

export async function getFamilyMembers(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      *,
      user:users (
        id,
        nickname,
        avatar_url
      )
    `)
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createFamilyForUser(user, name) {
  const existing = await getCurrentFamilyBundle(user.id)
  if (existing?.family) {
    throw new Error('User already has a family')
  }

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert([{
      name: String(name || '').trim() || buildDefaultFamilyName(user),
      owner_user_id: user.id,
      status: 'active'
    }])
    .select('*')
    .single()

  if (familyError || !family) throw familyError || new Error('Failed to create family')

  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .insert([{
      family_id: family.id,
      user_id: user.id,
      role: 'owner',
      relation: '自己',
      status: 'active'
    }])
    .select('*')
    .single()

  if (memberError || !member) throw memberError || new Error('Failed to create family owner')

  return { family, member }
}

export async function updateFamilyName(familyId, name) {
  const { data, error } = await supabase
    .from('families')
    .update({
      name: String(name || '').trim() || '我的家庭',
      updated_at: new Date().toISOString()
    })
    .eq('id', familyId)
    .select('*')
    .single()

  if (error || !data) throw error || new Error('Failed to update family')
  return data
}

function generateInviteCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function createFamilyInvite({ familyId, createdByUserId, role = 'editor', relation = '' }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('family_invites')
      .insert([{
        family_id: familyId,
        code,
        created_by_user_id: createdByUserId,
        role_to_grant: role,
        relation: relation || null,
        expires_at: expiresAt,
        status: 'active'
      }])
      .select('*')
      .maybeSingle()

    if (!error && data) return data
  }

  throw new Error('Failed to create family invite')
}

export async function joinFamilyByInvite(user, code) {
  const normalizedCode = String(code || '').trim()
  if (!normalizedCode) {
    throw new Error('Missing invite code')
  }

  const existing = await getCurrentFamilyBundle(user.id)
  if (existing?.family) {
    return existing
  }

  const { data: invite, error: inviteError } = await supabase
    .from('family_invites')
    .select('*')
    .eq('code', normalizedCode)
    .eq('status', 'active')
    .maybeSingle()

  if (inviteError) throw inviteError
  if (!invite) throw new Error('Invite code not found')
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabase
      .from('family_invites')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', invite.id)
    throw new Error('Invite code expired')
  }

  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .insert([{
      family_id: invite.family_id,
      user_id: user.id,
      role: invite.role_to_grant || 'editor',
      relation: invite.relation || null,
      status: 'active'
    }])
    .select('*')
    .single()

  if (memberError || !member) throw memberError || new Error('Failed to join family')

  await supabase
    .from('family_invites')
    .update({
      status: 'used',
      used_by_user_id: user.id,
      used_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', invite.id)

  const family = await getFamilyById(invite.family_id)
  return { family, member }
}

export async function updateFamilyMemberRole(familyId, memberId, role) {
  const { data, error } = await supabase
    .from('family_members')
    .update({
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .eq('family_id', familyId)
    .eq('status', 'active')
    .select('*')
    .single()

  if (error || !data) throw error || new Error('Failed to update member role')
  return data
}

export async function removeFamilyMember(familyId, memberId) {
  const { data, error } = await supabase
    .from('family_members')
    .update({
      status: 'removed',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .eq('family_id', familyId)
    .eq('status', 'active')
    .select('*')
    .single()

  if (error || !data) throw error || new Error('Failed to remove family member')
  return data
}

export async function backfillUserFamilyData(userId, familyId) {
  await supabase
    .from('babies')
    .update({ family_id: familyId })
    .eq('user_id', userId)
    .is('family_id', null)

  await supabase
    .from('growth_records')
    .update({ family_id: familyId })
    .eq('user_id', userId)
    .is('family_id', null)

  await supabase
    .from('weekly_plan_snapshots')
    .update({ family_id: familyId })
    .eq('user_id', userId)
    .is('family_id', null)
}
