const { User, Referral } = require('../models');

// @desc    Get user referral code, stats, and invited friends list
// @route   GET /api/referral/stats
// @access  Private
const getReferralStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Auto-generate code if user doesn't have one yet
        let userReferralCode = user.referralCode;
        if (!userReferralCode) {
            const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
            userReferralCode = `LARO-${randomPart}`;
            await user.update({ referralCode: userReferralCode });
        }

        // Fetch all referrals initiated by this user
        const referrals = await Referral.findAll({
            where: { referrerId: userId },
            include: [{
                model: User,
                as: 'referee',
                attributes: ['id', 'name', 'email', 'createdAt']
            }],
            order: [['createdAt', 'DESC']]
        });

        const totalFriendsReferred = referrals.length;
        const completedReferralsCount = referrals.filter(r => r.status === 'completed').length;
        const totalEarnedCoins = completedReferralsCount * 5;

        const friendsList = referrals.map(ref => ({
            id: ref.id,
            name: ref.referee ? ref.referee.name : 'Campus Friend',
            emailMasked: ref.referee ? ref.referee.email.replace(/(.{2})(.*)(?=@)/, '$1***') : '***',
            status: ref.status, // 'pending' | 'completed'
            rewardCoins: ref.rewardCoins || 5,
            joinedAt: ref.createdAt,
            completedAt: ref.completedAt
        }));

        res.status(200).json({
            referralCode: userReferralCode,
            totalFriendsReferred,
            completedReferralsCount,
            totalEarnedCoins,
            shareUrl: `https://laro.app/join?ref=${userReferralCode}`,
            shareMessage: `Hey! 🍔🛵 Join me on Laro campus delivery app!\n\nUse my referral code:\n👉 *${userReferralCode}* 👈\n\nBoth of us get *5 Laro Coins (5 Ł)* credited automatically when you place your 1st order! 🎉`,
            friendsList
        });

    } catch (error) {
        console.error('[REFERRAL] Error fetching stats:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getReferralStats
};
