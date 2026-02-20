class PageController {
    static async docs(req, res) {
        try {
            res.render('docs', { title: 'VU Empire Genie Documentation', header: false, footer: false });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = PageController;