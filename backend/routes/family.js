import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  createFamilyInvite,
  createFamilyForUser,
  getCurrentFamilyOrThrow,
  getFamilyMembers,
  joinFamilyByInvite,
  removeFamilyMember,
  updateFamilyMemberRole,
  updateFamilyName
} from '../services/family.js'

const router = express.Router()

router.use(authenticate)

router.post('/create', async (req, res) => {
  try {
    const bundle = await createFamilyForUser(req.user, req.body?.name)
    return res.json({
      code: 0,
      data: {
        family: bundle.family,
        member: bundle.member
      }
    })
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Failed to create family'
    })
  }
})

router.get('/current', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    const members = await getFamilyMembers(bundle.family.id)

    return res.json({
      code: 0,
      data: {
        family: bundle.family,
        my_role: bundle.member.role,
        member: bundle.member,
        members
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to get family'
    })
  }
})

router.post('/invite', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    if (bundle.member.role !== 'owner') {
      return res.status(403).json({
        code: 403,
        message: 'Only owner can invite members'
      })
    }

    const invite = await createFamilyInvite({
      familyId: bundle.family.id,
      createdByUserId: req.user.id,
      role: req.body?.role || 'editor',
      relation: req.body?.relation || ''
    })

    return res.json({
      code: 0,
      data: invite
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to create invite'
    })
  }
})

router.post('/join', async (req, res) => {
  try {
    const bundle = await joinFamilyByInvite(req.user, req.body?.code)
    return res.json({
      code: 0,
      data: {
        family: bundle.family,
        member: bundle.member
      }
    })
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Failed to join family'
    })
  }
})

router.get('/members', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    const members = await getFamilyMembers(bundle.family.id)
    return res.json({
      code: 0,
      data: { members }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to get family members'
    })
  }
})

router.patch('/name', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    if (bundle.member.role !== 'owner') {
      return res.status(403).json({
        code: 403,
        message: 'Only owner can update family'
      })
    }

    const family = await updateFamilyName(bundle.family.id, req.body?.name)
    return res.json({
      code: 0,
      data: { family }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to update family'
    })
  }
})

router.patch('/member/:memberId/role', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    if (bundle.member.role !== 'owner') {
      return res.status(403).json({
        code: 403,
        message: 'Only owner can update roles'
      })
    }

    const member = await updateFamilyMemberRole(bundle.family.id, req.params.memberId, req.body?.role || 'viewer')
    return res.json({
      code: 0,
      data: { member }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to update role'
    })
  }
})

router.delete('/member/:memberId', async (req, res) => {
  try {
    const bundle = await getCurrentFamilyOrThrow(req.user)
    if (bundle.member.role !== 'owner') {
      return res.status(403).json({
        code: 403,
        message: 'Only owner can remove members'
      })
    }

    const member = await removeFamilyMember(bundle.family.id, req.params.memberId)
    return res.json({
      code: 0,
      data: { member }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to remove member'
    })
  }
})

export default router
