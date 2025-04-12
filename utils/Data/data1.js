const mongoose = require('mongoose');
// Đảm bảo đường dẫn đến models là chính xác
const { Movie, Episode, Category } = require('../../models');

// Helper function to split comma-separated strings into arrays, trimming whitespace
const splitStringToArray = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// Helper function to extract country from the combined genres string (heuristic)
const extractCountry = (genresStr) => {
    if (!genresStr || typeof genresStr !== 'string') return 'Đang cập nhật';
    const parts = genresStr.split(',').map(s => s.trim());
    // List known countries/regions appearing in the examples
    const knownLocations = ['Hàn Quốc', 'Nhật Bản', 'Âu Mỹ', 'Anh', 'Mỹ'];
    let countryParts = [];

    // Check from the end if parts match known locations
    for (let i = parts.length - 1; i >= 0; i--) {
        if (knownLocations.includes(parts[i])) {
            countryParts.unshift(parts[i]); // Add to beginning to maintain order
        } else {
            // Stop if we encounter a non-location part after finding at least one location
            if (countryParts.length > 0) break;
        }
    }

    return countryParts.length > 0 ? countryParts.join(', ') : 'Đang cập nhật';
};

// Helper function to extract genres (excluding country)
const extractGenres = (genresStr, country) => {
    if (!genresStr || typeof genresStr !== 'string') return [];
    let genresOnlyStr = genresStr;
    if (country && country !== 'Đang cập nhật') {
        // Remove the country part(s) from the end of the string before splitting
        const countrySuffix = `, ${country}`;
        if (genresOnlyStr.endsWith(countrySuffix)) {
            genresOnlyStr = genresOnlyStr.substring(0, genresOnlyStr.length - countrySuffix.length);
        }
        // Handle cases where country might be the only thing left or part of the last element without a preceding comma (less likely with trim)
        // This simple replace might need refinement for complex cases but works for the examples
    }
    return splitStringToArray(genresOnlyStr);
};


// Main function to insert data
const insertData = async () => {
    try {
        // Lấy các category từ database
        const categories = await Category.find();

        // Map các category theo slug để dễ sử dụng
        const categoryMap = {
            'anime': categories.find(c => c.slug === 'anime')?._id,
            'movie': categories.find(c => c.slug === 'movie')?._id,
            'series': categories.find(c => c.slug === 'series')?._id
        };

        // Kiểm tra xem đã lấy được category chưa
        if (!categoryMap.anime || !categoryMap.movie || !categoryMap.series) {
            console.error('Không thể tìm thấy một hoặc nhiều category cần thiết.');
            // Log chi tiết hơn để debug
            console.log('Các category slugs tìm thấy:', categories.map(c => c.slug));
            console.log('Category map kết quả:', {
                anime: categoryMap.anime ? 'OK' : 'MISSING',
                movie: categoryMap.movie ? 'OK' : 'MISSING',
                series: categoryMap.series ? 'OK' : 'MISSING',
            });
            console.log('Expected ObjectIDs (Example):', {
                anime: "67f79c7da489301c5f1c24ae", // Ví dụ ObjectId bạn cung cấp
                movie: "67f79ca8a489301c5f1c24b5", // Ví dụ ObjectId bạn cung cấp
                series: "67f7f5bf2e72d1e9732e201c" // Ví dụ ObjectId bạn cung cấp
            });
            return;
        }

        console.log('Đã tìm thấy các category ObjectIds:', {
            anime: categoryMap.anime.toString(),
            movie: categoryMap.movie.toString(),
            series: categoryMap.series.toString()
        });

        // Dữ liệu phim (Kết hợp dữ liệu gốc và dữ liệu từ MySQL)
        const movies = [
            // --- Phim 1: Ngôi Trường Xác Sống (All of Us Are Dead) - Dữ liệu từ MySQL ---
            {
                slug: 'ngoi-truong-xac-song',
                origin_name: 'All of Us Are Dead',
                name: 'Ngôi Trường Xác Sống',
                // MySQL genres: 'Hành Động, Phiêu Lưu, Chính Kịch, Khoa Học, Viễn Tưởng, Hàn Quốc'
                genres: extractGenres('Hành Động, Phiêu Lưu, Chính Kịch, Khoa Học, Viễn Tưởng, Hàn Quốc', 'Hàn Quốc'),
                country: extractCountry('Hành Động, Phiêu Lưu, Chính Kịch, Khoa Học, Viễn Tưởng, Hàn Quốc'), // 'Hàn Quốc'
                description:
                    'Một trường cấp ba trở thành điểm bùng phát virus thây ma. Các học sinh mắc kẹt phải nỗ lực thoát ra – hoặc biến thành một trong những người nhiễm bệnh hung tợn.',
                actor: splitStringToArray('Park Ji-hu, Yoon Chan-young, Cho Yi-hyun, Lomon, Yoo In-soo, Lee You-mi, Kim Byung-chul, Lee Kyoo-hyung, Jeon Bae-soo'),
                director: splitStringToArray('Đang cập nhật'),
                year: 2022,
                poster_url: 'https://phimimg.com/upload/vod/20250325-1/6db202d6161c123d96b0180c2da9b1e5.jpg',
                trailer_url: 'https://www.youtube.com/watch?v=IN5TD4VRcSM', // Từ MySQL
                type: 'series', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg',
                category: categoryMap.series, // Từ MySQL category_id = 3
                episodes: [
                    { title: 'Tập 01', description: 'Tập 1. Một khởi đầu đầy kịch tính tại trường học khi virus lạ bắt đầu lan rộng.', video_url: 'https://s4.phim1280.tv/20250325/15U0OSx5/index.m3u8', release_date: new Date(), episode_number: 1, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-01' },
                    { title: 'Tập 02', description: 'Tập 2. Các học sinh phải đối mặt với sự thật kinh hoàng và tìm cách sinh tồn.', video_url: 'https://s4.phim1280.tv/20250325/L13mtaK3/index.m3u8', release_date: new Date(), episode_number: 2, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-02' },
                    { title: 'Tập 03', description: 'Tập 3. Sự hỗn loạn gia tăng, những quyết định khó khăn được đưa ra.', video_url: 'https://s4.phim1280.tv/20250325/xqyp5Z1I/index.m3u8', release_date: new Date(), episode_number: 3, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-03' },
                    { title: 'Tập 04', description: 'Tập 4. Mất mát và hy vọng đan xen khi nhóm tìm đường thoát.', video_url: 'https://s4.phim1280.tv/20250325/urYLPIR6/index.m3u8', release_date: new Date(), episode_number: 4, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-04' },
                    { title: 'Tập 05', description: 'Tập 5. Những mối nguy hiểm mới xuất hiện từ cả bên trong lẫn bên ngoài.', video_url: 'https://s4.phim1280.tv/20250325/PzPUQ6vI/index.m3u8', release_date: new Date(), episode_number: 5, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-05' },
                    { title: 'Tập 06', description: 'Tập 6. Kế hoạch được vạch ra, nhưng liệu có thành công?', video_url: 'https://s4.phim1280.tv/20250325/BqradtcC/index.m3u8', release_date: new Date(), episode_number: 6, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-06' },
                    { title: 'Tập 07', description: 'Tập 7. Đối mặt với tình huống ngặt nghèo, tình bạn bị thử thách.', video_url: 'https://s4.phim1280.tv/20250325/NOt6t0Kl/index.m3u8', release_date: new Date(), episode_number: 7, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-07' },
                    { title: 'Tập 08', description: 'Tập 8. Phát hiện quan trọng và những hy sinh đau đớn.', video_url: 'https://s4.phim1280.tv/20250325/7lkLmHTd/index.m3u8', release_date: new Date(), episode_number: 8, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-08' },
                    { title: 'Tập 09', description: 'Tập 9. Cuộc chiến sinh tồn ngày càng khốc liệt hơn.', video_url: 'https://s4.phim1280.tv/20250325/CX7skR5r/index.m3u8', release_date: new Date(), episode_number: 9, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-09' },
                    { title: 'Tập 10', description: 'Tập 10. Niềm tin lung lay và những bí mật được hé lộ.', video_url: 'https://s4.phim1280.tv/20250325/BceIVv5Y/index.m3u8', release_date: new Date(), episode_number: 10, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-10' },
                    { title: 'Tập 11', description: 'Tập 11. Chuẩn bị cho trận chiến cuối cùng.', video_url: 'https://s4.phim1280.tv/20250325/maF3oplG/index.m3u8', release_date: new Date(), episode_number: 11, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-11' },
                    { title: 'Tập 12', description: 'Tập 12. Cái kết cho cuộc chiến tại trường học và tương lai nào đang chờ đợi?', video_url: 'https://s4.phim1280.tv/20250325/YbkatJrM/index.m3u8', release_date: new Date(), episode_number: 12, thumbnail_url: 'https://phimimg.com/upload/vod/20250325-1/6985255433cba78af7f28fe63c5126c9.jpg', slug: 'tap-12' },
                ],
            },
            // --- Phim 2: Batman Ninja Đối Đầu Liên Minh Yakuza - Dữ liệu từ MySQL ---
            {
                slug: 'batman-ninja-doi-dau-lien-minh-yakuza',
                origin_name: 'Batman Ninja vs. Yakuza League',
                name: 'Batman Ninja Đối Đầu Liên Minh Yakuza',
                // MySQL genres: 'Hành Động, Phiêu Lưu, Nhật Bản, Âu Mỹ'
                genres: extractGenres('Hành Động, Phiêu Lưu, Nhật Bản, Âu Mỹ', 'Nhật Bản, Âu Mỹ'),
                country: extractCountry('Hành Động, Phiêu Lưu, Nhật Bản, Âu Mỹ'), // 'Nhật Bản, Âu Mỹ'
                description:
                    'Gia đình Batman trở về hiện tại và phát hiện Nhật Bản đã biến mất, thay vào đó là một hòn đảo khổng lồ tên Hinomoto lơ lửng trên bầu trời Gotham. Trên đỉnh quyền lực là Yakuza – một nhóm siêu nhân cai trị tàn bạo và trông rất giống Justice League. Giờ đây, Batman và đồng đội phải chiến đấu để cứu Gotham!',
                actor: splitStringToArray('Koichi Yamadera, Yuki Kaji, Kengo Kawanishi, Daisuke Ono, Akira Ishida, Ayane Sakura, Akio Otsuka, Nobuyuki Hiyama, Romi Park, Rie Kugimiya, Wataru Takagi, Hochu Otsuka, Masaki Terasoma, Kazuhiro Yamaji, Takaya Kamikawa'),
                director: splitStringToArray('Jumpei Mizusaki, Shinji Takagi'),
                year: 2025,
                poster_url: 'https://phimimg.com/upload/vod/20250328-1/844101bcb965fcf508838d4b9356649c.jpg',
                trailer_url: 'https://www.youtube.com/watch?v=QleeDtH_WWE', // Từ MySQL
                type: 'movie', // Từ MySQL (ánh xạ từ 'hoathinh'?)
                thumbnail_url: 'https://phimimg.com/upload/vod/20250328-1/7e743bf2f82e6a4383f9add3ac5fdec0.jpg',
                category: categoryMap.anime, // Từ MySQL category_id = 2
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Batman Ninja Đối Đầu Liên Minh Yakuza (Full).',
                        video_url: 'https://s4.phim1280.tv/20250328/XzEQJhgt/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20250328-1/7e743bf2f82e6a4383f9add3ac5fdec0.jpg',
                        slug: 'full',
                    },
                ],
            },
            // --- Phim 3: Nhà Tù Shawshank - Dữ liệu từ MySQL ---
            {
                slug: 'nha-tu-shawshank',
                origin_name: 'The Shawshank Redemption',
                name: 'Nhà Tù Shawshank',
                // MySQL genres: 'Chính Kịch, Hình Sự, Âu Mỹ'
                genres: extractGenres('Chính Kịch, Hình Sự, Âu Mỹ', 'Âu Mỹ'),
                country: extractCountry('Chính Kịch, Hình Sự, Âu Mỹ'), // 'Âu Mỹ'
                description:
                    'Nhà tù Shawshank kể về Andrew, một nhân viên nhà băng, bị kết án chung thân sau khi giết vợ và nhân tình của cô. Anh một mực cho rằng mình bị oan. Andy bị đưa tới nhà tù Shawshank. Qua con mắt và lời kể của Redding, cuộc vượt ngục vĩ đại này được kể tuần tự cùng một kết thúc bất ngờ',
                actor: splitStringToArray('Tim Robbins, Morgan Freeman, Bob Gunton, William Sadler, Clancy Brown, Gil Bellows, James Whitmore, Mark Rolston, Jeffrey DeMunn, Larry Brandenburg, Neil Giuntoli, Brian Libby, David Proval, Joseph Ragno, Jude Ciccolella, Paul McCrane, Renee Blaine, Scott'),
                director: splitStringToArray('Frank Darabont'),
                year: 1994,
                poster_url: 'https://phimimg.com/upload/vod/20231018-1/202b6de69554481f31e54423c8ed7309.jpg',
                trailer_url: 'https://s2.phim1280.tv/20231019/SRNpBmu7/index.m3u8', // Từ MySQL
                type: 'movie', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20231018-1/e31eee0d4db3c8a1b194e76a36ca26b9.jpg',
                category: categoryMap.movie, // Từ MySQL category_id = 1 (Do type 'single' trong API gốc)
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Nhà Tù Shawshank (Full).',
                        video_url: 'https://s2.phim1280.tv/20231019/SRNpBmu7/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20231018-1/e31eee0d4db3c8a1b194e76a36ca26b9.jpg',
                        slug: 'full',
                    },
                ],
            },
            // --- Phim 4: Kẻ Đánh Cắp Giấc Mơ (Inception) - Dữ liệu từ MySQL ---
            {
                slug: 'ke-danh-cap-giac-mo',
                origin_name: 'Inception',
                name: 'Kẻ Đánh Cắp Giấc Mơ',
                // MySQL genres: 'Hành Động, Khoa Học, Phiêu Lưu, Anh, Âu Mỹ'
                genres: extractGenres('Hành Động, Khoa Học, Phiêu Lưu, Anh, Âu Mỹ', 'Anh, Âu Mỹ'),
                country: extractCountry('Hành Động, Khoa Học, Phiêu Lưu, Anh, Âu Mỹ'), // 'Anh, Âu Mỹ'
                description: 'Cobb đánh cắp thông tin từ các mục tiêu của mình bằng cách đi vào giấc mơ của họ. Saito đề nghị xóa sạch tiền án của Cobb như một khoản thanh toán cho việc thực hiện hành vi đầu tiên đối với con trai của đối thủ cạnh tranh ốm yếu của mình.',
                actor: splitStringToArray('Leonardo DiCaprio, Joseph Gordon-Levitt, Ken Watanabe, Tom Hardy, Elliot Page, Dileep Rao, Cillian Murphy, Tom Berenger, Marion Cotillard, Pete Postlethwaite, Michael Caine, Lukas Haas, Talulah Riley, Tohoru Masamune, Taylor Geare, Claire Geare, Johnathan'),
                director: splitStringToArray('Christopher Nolan'),
                year: 2010,
                poster_url: 'https://phimimg.com/upload/vod/20231018-1/d0ccc81540ff2c85cecbf73dda05728f.jpg',
                trailer_url: 'https://s5.phim1280.tv/20240911/qTL6xlyr/index.m3u8', // Từ MySQL
                type: 'movie', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20231018-1/ea2205d6cdedccf1251422eb4fa85f6d.jpg',
                category: categoryMap.movie, // Từ MySQL category_id = 1
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Kẻ Đánh Cắp Giấc Mơ (Full).',
                        video_url: 'https://s5.phim1280.tv/20240911/qTL6xlyr/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20231018-1/ea2205d6cdedccf1251422eb4fa85f6d.jpg',
                        slug: 'full',
                    },
                ],
            },
            // --- Phim 5: Bố Già (The Godfather) - Dữ liệu từ MySQL ---
            {
                slug: 'bo-gia-1972',
                origin_name: 'The Godfather',
                name: 'Bố Già',
                // MySQL genres: 'Chính Kịch, Hình Sự, Âu Mỹ'
                genres: extractGenres('Chính Kịch, Hình Sự, Âu Mỹ', 'Âu Mỹ'),
                country: extractCountry('Chính Kịch, Hình Sự, Âu Mỹ'), // 'Âu Mỹ'
                description: 'Một câu chuyện kéo dài từ năm 1945 đến năm 1955, một biên niên sử về gia đình tội phạm Corleone người Mỹ gốc Ý. Khi tộc trưởng gia đình tội phạm có tổ chức, Vito Corleone bị ám sát bởi băng nhóm đối thủ, con trai út của ông, Michael đã phải nhúng tay vào tội ác và chống lại đối thủ với việc phát động một chiến dịch trả thù đẫm máu.',
                actor: splitStringToArray('Marlon Brando, Al Pacino, James Caan, Robert Duvall, Richard S. Castellano, Diane Keaton, Talia Shire, Gianni Russo, Sterling Hayden, John Marley'),
                director: splitStringToArray('Francis Ford Coppola'),
                year: 1972,
                poster_url: 'https://phimimg.com/upload/vod/20231014-1/39aa8b76c6b10330bd685897500a6026.jpg',
                trailer_url: 'https://s2.phim1280.tv/20231017/sO7PyfCM/index.m3u8', // Từ MySQL
                type: 'movie', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20231014-1/8274cbb886030eda232520b329dc2bbb.jpg',
                category: categoryMap.movie, // Từ MySQL category_id = 1
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Bố Già (Full).',
                        video_url: 'https://s2.phim1280.tv/20231017/sO7PyfCM/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20231014-1/8274cbb886030eda232520b329dc2bbb.jpg',
                        slug: 'full',
                    },
                ],
            },
            // --- Phim 6: Chuyện Tào Lao (Pulp Fiction) - Dữ liệu từ MySQL ---
            {
                slug: 'chuyen-tao-lao',
                origin_name: 'Pulp Fiction',
                name: 'Chuyện Tào Lao',
                // MySQL genres: 'Tâm Lý, Hình Sự, Âu Mỹ'
                genres: extractGenres('Tâm Lý, Hình Sự, Âu Mỹ', 'Âu Mỹ'),
                country: extractCountry('Tâm Lý, Hình Sự, Âu Mỹ'), // 'Âu Mỹ'
                description: 'Những câu chuyện tưởng chừng tầm phào về 2 gã găng tơ trên đường thực hiện mệnh lệnh của ông chủ với 1 võ sĩ quyền anh giết chết người phải chạy trốn có vẻ không liên quan nhưng khi ghép lại người xem sẽ có 1 bức tranh tổng thể, đặc trưng cho phong cách của đạo diễn Quentin Tarantino: đậm chất bạo lực, máu me.',
                actor: splitStringToArray('John Travolta, Samuel L. Jackson, Uma Thurman, Bruce Willis, Ving Rhames, Harvey Keitel, Eric Stoltz, Tim Roth, Amanda Plummer, Maria de Medeiros, Quentin Tarantino, Christopher Walken, Rosanna Arquette, Peter Greene, Duane Whitaker, Angela Jones, Phil La'),
                director: splitStringToArray('Quentin Tarantino'),
                year: 1994,
                poster_url: 'https://phimimg.com/upload/vod/20231019-1/bebb7b1cf9f75cbcd81fe2333dfc3eb1.jpg',
                trailer_url: 'https://s3.phim1280.tv/20240618/VbXKq0OU/index.m3u8', // Từ MySQL
                type: 'movie', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20231019-1/d8cb231f36481392329c958e2204eb66.jpg',
                category: categoryMap.movie, // Từ MySQL category_id = 1
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Chuyện Tào Lao (Full).',
                        video_url: 'https://s3.phim1280.tv/20240618/VbXKq0OU/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20231019-1/d8cb231f36481392329c958e2204eb66.jpg',
                        slug: 'full',
                    },
                ],
            },
            // --- Phim 7: Cuộc Đời Forrest Gump (Forrest Gump) - Dữ liệu từ MySQL ---
            {
                slug: 'cuoc-doi-forrest-gump',
                origin_name: 'Forrest Gump',
                name: 'Cuộc Đời Forrest Gump',
                // MySQL genres: 'Hài Hước, Chính Kịch, Tình Cảm, Âu Mỹ'
                genres: extractGenres('Hài Hước, Chính Kịch, Tình Cảm, Âu Mỹ', 'Âu Mỹ'),
                country: extractCountry('Hài Hước, Chính Kịch, Tình Cảm, Âu Mỹ'), // 'Âu Mỹ'
                description: 'Forrest Gump là một đứa trẻ bất hạnh khi sinh ra đã không có cha, hơn nữa Forrest còn bị thiểu năng. Forrest luôn bị bạn bè cùng trang lứa trêu trọc, bắt nạt. Người bạn duy nhất của Forrest là Jenny, chính Jenny đã phát hiện ra những khả năng đặc biệt của anh. Tốt nghiệp đại học Forrest nhập ngũ và tham chiến ở Việt Nam, Bubba trở thành bạn thân thứ 2 của anh. Forrest rời chiến trường với vết thương và khả năng chơi bóng bàn xuất sắc. Những biến cố nối tiếp nhau xuất hiện làm thay đổi hoàn toàn cuộc đời Forrest.',
                actor: splitStringToArray('Tom Hanks, Robin Wright, Gary Sinise, Sally Field, Mykelti Williamson, Michael Conner Humphreys, Hanna Hall, Haley Joel Osment, Siobhan Fallon Hogan, Rebecca Williams'),
                director: splitStringToArray('Robert Zemeckis'),
                year: 1994,
                poster_url: 'https://phimimg.com/upload/vod/20230923-1/0238878e80d08aac4e1d4126f23840ba.jpg',
                trailer_url: 'https://s2.phim1280.tv/20230923/MxarzCw0/index.m3u8', // Từ MySQL
                type: 'movie', // Từ MySQL
                thumbnail_url: 'https://phimimg.com/upload/vod/20230923-1/496cbec2d5df42fa0c816a7a9ee12206.jpg',
                category: categoryMap.movie, // Từ MySQL category_id = 1
                episodes: [
                    {
                        title: 'Full',
                        description: 'Xem phim Cuộc Đời Forrest Gump (Full).',
                        video_url: 'https://s2.phim1280.tv/20230923/MxarzCw0/index.m3u8',
                        release_date: new Date(),
                        episode_number: 1,
                        thumbnail_url: 'https://phimimg.com/upload/vod/20230923-1/496cbec2d5df42fa0c816a7a9ee12206.jpg',
                        slug: 'full',
                    },
                ],
            },
        ];

        // --- Phần logic insert/update giữ nguyên như code gốc của bạn ---
        let insertedMoviesCount = 0;
        let insertedEpisodesCount = 0;

        for (const movieData of movies) {
            // Extract episodes before saving the movie
            const episodes = movieData.episodes;
            delete movieData.episodes;

            try {
                // Upsert movie: Update if slug exists, insert if not
                const movie = await Movie.findOneAndUpdate(
                    { slug: movieData.slug }, // Condition to find the movie
                    movieData,                // Data to insert or update
                    {
                        upsert: true,             // Create if doesn't exist
                        new: true,                // Return the updated/created document
                        setDefaultsOnInsert: true // Apply schema defaults on insert
                    }
                );
                insertedMoviesCount++;
                console.log(`Đã thêm/cập nhật phim: ${movie.name} (${movie._id})`);

                // Insert/Update episodes for this movie
                if (episodes && episodes.length > 0) {
                    for (const episodeData of episodes) {
                        // Upsert episode: Match by movie ID and episode slug
                        const episode = await Episode.findOneAndUpdate(
                            { movie: movie._id, slug: episodeData.slug }, // Condition
                            { ...episodeData, movie: movie._id },         // Data (ensure movie ref is set)
                            {
                                upsert: true,
                                new: true,
                                setDefaultsOnInsert: true
                            }
                        );
                        insertedEpisodesCount++;
                        console.log(` -> Đã thêm/cập nhật tập: ${episode.title} (${episode._id}) cho phim ${movie.name}`);
                    }
                }
            } catch (error) {
                console.error(`Lỗi khi xử lý phim ${movieData.name}:`, error);
                // Optional: decide if you want to stop the loop or continue with the next movie
            }
        }

        console.log('--------------------------------------------------');
        console.log(`Đã hoàn tất! Đã thêm/cập nhật ${insertedMoviesCount} phim và ${insertedEpisodesCount} tập.`);

    } catch (error) {
        console.error('Lỗi tổng thể khi thêm dữ liệu:', error);
    }
    // Không đóng kết nối ở đây nếu app.js quản lý kết nối
    // finally {
    //     mongoose.connection.close();
    // }
};

// Chạy hàm thêm dữ liệu
insertData().then(() => {
    console.log('Hoàn tất chạy script thêm dữ liệu.');
    // Bạn có thể thêm mongoose.disconnect() ở đây nếu đây là script chạy độc lập
    // mongoose.disconnect().then(() => console.log('Đã đóng kết nối MongoDB.'));
}).catch(err => {
    console.error('Script gặp lỗi khi thực thi:', err);
    // Đảm bảo đóng kết nối nếu có lỗi xảy ra và script chạy độc lập
    // mongoose.disconnect().then(() => console.log('Đã đóng kết nối MongoDB sau lỗi.'));
});

// Export hàm nếu bạn muốn gọi nó từ nơi khác (ví dụ: một route API hoặc một script khác)
module.exports = { insertData };
