const { Quest, Product, University } = require('../models');

// @desc    Create a new Quest
// @route   POST /api/admin/quests
// @access  Private/Admin
const createQuest = async (req, res) => {
    try {
        const { title, description, universityId, productId, targetCount, rewardAmount } = req.body;

        if (!title || !universityId || !productId || !targetCount || !rewardAmount) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const quest = await Quest.create({
            title,
            description,
            universityId,
            productId,
            targetCount,
            rewardAmount,
            status: 'active',
            currentCount: 0
        });

        res.status(201).json(quest);
    } catch (error) {
        res.status(500).json({ message: 'Error creating quest', error: error.message });
    }
};

// @desc    Get all Quests
// @route   GET /api/admin/quests
// @access  Private/Admin
const getQuests = async (req, res) => {
    try {
        const quests = await Quest.findAll({
            include: [
                { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'imageUrl'] },
                { model: University, as: 'university', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(quests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quests', error: error.message });
    }
};

// @desc    Get active Quests for student's university
// @route   GET /api/quests/active
// @access  Private
const getActiveQuestsForUser = async (req, res) => {
    try {
        if (!req.user || !req.user.universityId) {
            return res.status(400).json({ message: 'User university context not set' });
        }

        const quests = await Quest.findAll({
            where: {
                universityId: req.user.universityId,
                status: 'active'
            },
            include: [
                { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'imageUrl'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(quests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active quests', error: error.message });
    }
};

// @desc    Delete a Quest
// @route   DELETE /api/admin/quests/:id
// @access  Private/Admin
const deleteQuest = async (req, res) => {
    try {
        const quest = await Quest.findByPk(req.params.id);
        if (!quest) {
            return res.status(404).json({ message: 'Quest not found' });
        }

        await quest.destroy();
        res.json({ message: 'Quest deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quest', error: error.message });
    }
};

module.exports = {
    createQuest,
    getQuests,
    getActiveQuestsForUser,
    deleteQuest
};
