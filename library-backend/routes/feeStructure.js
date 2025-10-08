const express = require('express');
const router = express.Router();
const FeeStructure = require('../models/FeeStructure');
const Fee = require('../models/Fee');
const auth = require('../middleware/authMiddleware');

// Get all fee structures for current library
router.get('/', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find({ 
      library: req.user.libraryId 
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ effectiveFrom: -1 });

    res.json(feeStructures);
  } catch (error) {
    console.error('Fee structures fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch fee structures' });
  }
});

// Get current active fee structure for library
router.get('/current', auth.verifyToken, async (req, res) => {
  try {
    const currentStructure = await FeeStructure.getCurrentStructure(req.user.libraryId);
    
    if (!currentStructure) {
      return res.status(404).json({ message: 'No active fee structure found' });
    }

    res.json(currentStructure);
  } catch (error) {
    console.error('Current fee structure fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch current fee structure' });
  }
});

// Get fee structure by ID
router.get('/:id', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      library: req.user.libraryId
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json(feeStructure);
  } catch (error) {
    console.error('Fee structure fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch fee structure' });
  }
});

// Create new fee structure
router.post('/', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      slotFees, 
      effectiveFrom,
      applyToFutureFees = true 
    } = req.body;

    // Validate required fields
    if (!name || !slotFees || !Array.isArray(slotFees) || slotFees.length === 0) {
      return res.status(400).json({ 
        message: 'Name and slot fees are required' 
      });
    }

    // Validate slot fees
    for (const slotFee of slotFees) {
      if (!slotFee.slotType || !slotFee.slotName || slotFee.amount === undefined) {
        return res.status(400).json({ 
          message: 'Each slot fee must have slotType, slotName, and amount' 
        });
      }
      if (slotFee.amount < 0) {
        return res.status(400).json({ 
          message: 'Fee amounts must be non-negative' 
        });
      }
    }

    // Set effective date (default to current date if not provided)
    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
    
    // Prevent setting effective date in the past (unless admin override)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (effectiveDate < now && !req.body.allowBackdating) {
      return res.status(400).json({ 
        message: 'Effective date cannot be in the past. Use allowBackdating flag to override.' 
      });
    }

    // Create new fee structure
    const feeStructure = new FeeStructure({
      library: req.user.libraryId,
      name,
      description: description || '',
      slotFees,
      effectiveFrom: effectiveDate,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await feeStructure.save();

    // If applying to future fees, update unpaid fees from effective date
    if (applyToFutureFees) {
      try {
        const updatedCount = await Fee.regenerateFeesFromDate(
          req.user.libraryId, 
          effectiveDate, 
          feeStructure._id
        );
        
        res.json({ 
          message: 'Fee structure created successfully',
          feeStructure,
          updatedFeesCount: updatedCount
        });
      } catch (feeUpdateError) {
        console.error('Error updating fees:', feeUpdateError);
        res.json({ 
          message: 'Fee structure created successfully, but failed to update existing fees',
          feeStructure,
          warning: 'Existing fees were not updated'
        });
      }
    } else {
      res.json({ 
        message: 'Fee structure created successfully',
        feeStructure 
      });
    }

  } catch (error) {
    console.error('Fee structure creation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'A fee structure with this configuration already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create fee structure' });
    }
  }
});

// Update fee structure
router.put('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      slotFees,
      effectiveFrom,
      applyToFutureFees = false 
    } = req.body;

    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      library: req.user.libraryId
    });

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Check if structure is already in use (has effective date in past)
    const now = new Date();
    if (feeStructure.effectiveFrom < now && feeStructure.isActive) {
      return res.status(400).json({ 
        message: 'Cannot modify fee structure that is already in effect. Create a new structure instead.' 
      });
    }

    // Validate updates
    if (slotFees && Array.isArray(slotFees)) {
      for (const slotFee of slotFees) {
        if (!slotFee.slotType || !slotFee.slotName || slotFee.amount === undefined) {
          return res.status(400).json({ 
            message: 'Each slot fee must have slotType, slotName, and amount' 
          });
        }
        if (slotFee.amount < 0) {
          return res.status(400).json({ 
            message: 'Fee amounts must be non-negative' 
          });
        }
      }
    }

    // Update fields
    if (name) feeStructure.name = name;
    if (description !== undefined) feeStructure.description = description;
    if (slotFees) feeStructure.slotFees = slotFees;
    if (effectiveFrom) feeStructure.effectiveFrom = new Date(effectiveFrom);
    feeStructure.updatedBy = req.user.id;

    await feeStructure.save();

    // Apply to future fees if requested
    if (applyToFutureFees) {
      try {
        const updatedCount = await Fee.regenerateFeesFromDate(
          req.user.libraryId, 
          feeStructure.effectiveFrom, 
          feeStructure._id
        );
        
        res.json({ 
          message: 'Fee structure updated successfully',
          feeStructure,
          updatedFeesCount: updatedCount
        });
      } catch (feeUpdateError) {
        console.error('Error updating fees:', feeUpdateError);
        res.json({ 
          message: 'Fee structure updated successfully, but failed to update existing fees',
          feeStructure,
          warning: 'Existing fees were not updated'
        });
      }
    } else {
      res.json({ 
        message: 'Fee structure updated successfully',
        feeStructure 
      });
    }

  } catch (error) {
    console.error('Fee structure update error:', error);
    res.status(500).json({ message: 'Failed to update fee structure' });
  }
});

// Deactivate fee structure
router.patch('/:id/deactivate', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { effectiveTo } = req.body;

    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      library: req.user.libraryId
    });

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    const deactivationDate = effectiveTo ? new Date(effectiveTo) : new Date();
    await feeStructure.deactivate(deactivationDate);

    res.json({ 
      message: 'Fee structure deactivated successfully',
      feeStructure 
    });

  } catch (error) {
    console.error('Fee structure deactivation error:', error);
    res.status(500).json({ message: 'Failed to deactivate fee structure' });
  }
});

// Delete fee structure (only if not yet effective)
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      library: req.user.libraryId
    });

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Check if structure has been used
    const now = new Date();
    if (feeStructure.effectiveFrom <= now) {
      return res.status(400).json({ 
        message: 'Cannot delete fee structure that has been or is currently effective. Deactivate it instead.' 
      });
    }

    // Check if any fees reference this structure
    const referencedFees = await Fee.countDocuments({ feeStructure: feeStructure._id });
    if (referencedFees > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete fee structure that is referenced by existing fees' 
      });
    }

    await FeeStructure.findByIdAndDelete(req.params.id);

    res.json({ message: 'Fee structure deleted successfully' });

  } catch (error) {
    console.error('Fee structure deletion error:', error);
    res.status(500).json({ message: 'Failed to delete fee structure' });
  }
});

// Preview fee changes for a specific structure
router.post('/:id/preview', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const { effectiveFrom } = req.body;

    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      library: req.user.libraryId
    });

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : feeStructure.effectiveFrom;
    
    // Find fees that would be affected
    const affectedFees = await Fee.find({
      library: req.user.libraryId,
      paid: false,
      $or: [
        { year: { $gt: effectiveDate.getFullYear() } },
        { 
          year: effectiveDate.getFullYear(), 
          month: { $gte: effectiveDate.getMonth() + 1 } 
        }
      ]
    }).populate('student', 'name email slot');

    // Calculate changes
    const preview = affectedFees.map(fee => {
      const slotFee = feeStructure.slotFees.find(sf => sf.slotType === fee.student.slot);
      const newAmount = slotFee ? slotFee.amount : fee.amount;
      
      return {
        feeId: fee._id,
        studentName: fee.student.name,
        month: fee.month,
        year: fee.year,
        currentAmount: fee.amount,
        newAmount,
        difference: newAmount - fee.amount,
        slotType: fee.student.slot
      };
    });

    const summary = {
      totalFeesAffected: preview.length,
      totalCurrentAmount: preview.reduce((sum, p) => sum + p.currentAmount, 0),
      totalNewAmount: preview.reduce((sum, p) => sum + p.newAmount, 0),
      totalDifference: preview.reduce((sum, p) => sum + p.difference, 0)
    };

    res.json({ 
      preview,
      summary,
      effectiveDate 
    });

  } catch (error) {
    console.error('Fee structure preview error:', error);
    res.status(500).json({ message: 'Failed to generate preview' });
  }
});

module.exports = router;
