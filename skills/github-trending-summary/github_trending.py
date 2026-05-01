#!/usr/bin/env python3
"""GitHub Trending Projects Data Collector for ClawdBot"""

import json
import sys
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import os
from bs4 import BeautifulSoup
import concurrent.futures

class GitHubTrendingAnalyzer:
    def __init__(self):
        # 加载配置
        self.config = self.load_config()

        # 创建两个session：一个用于HTML scraping，一个用于API调用
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        self.html_session = requests.Session()
        self.html_session.verify = False
        self.html_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })

        self.api_session = requests.Session()
        self.api_session.verify = False
        api_headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; ClawdBot/1.0)',
            'Accept': 'application/vnd.github.v3+json'
        }

        # 如果有API token，添加到请求头
        token = self.config.get('GITHUB_API_TOKEN', '').strip()
        if token:
            api_headers['Authorization'] = f'token {token}'

        self.api_session.headers.update(api_headers)

    def load_config(self) -> Dict[str, str]:
        """加载配置：config.env 文件 < 环境变量"""
        config = {}
        config_file = os.path.join(os.path.dirname(__file__), 'config.env')

        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        # 处理注释：只取等号前后的部分，忽略#注释
                        if '#' in line:
                            line = line.split('#')[0].strip()

                        key, value = line.split('=', 1)
                        # 移除引号
                        value = value.strip('"').strip("'")
                        config[key.strip()] = value

        # 环境变量优先级高于 config.env
        for key in ('GITHUB_API_TOKEN', 'DEFAULT_LANGUAGE', 'DEFAULT_LIMIT'):
            env_val = os.environ.get(key)
            if env_val is not None:
                config[key] = env_val

        return config

    def fetch_from_trending_page(self, language: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """从GitHub trending页面获取热门项目"""
        try:
            # 构建trending页面URL
            base_url = 'https://github.com/trending'
            if language:
                url = f'{base_url}/{language}?since=daily'
            else:
                url = f'{base_url}?since=daily'

            response = self.html_session.get(url, timeout=30)
            print(f"DEBUG: URL={url}, Status={response.status_code}", file=sys.stderr)
            response.raise_for_status()

            # 解析HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # 查找所有项目
            repo_elements = soup.find_all('article', class_='Box-row')
            print(f"DEBUG: Found {len(repo_elements)} repo elements", file=sys.stderr)

            repos = []
            for i, repo_elem in enumerate(repo_elements[:limit]):
                repo_data = self.parse_repo_element(repo_elem)
                if repo_data:
                    repos.append(repo_data)

            return repos

        except Exception as e:
            print(f"Error fetching trending data: {e}", file=sys.stderr)
            return []

    def parse_repo_element(self, repo_elem) -> Optional[Dict]:
        """解析单个项目元素"""
        try:
            # 获取项目名称和所有者
            repo_link = repo_elem.find('h2', class_='h3').find('a')
            if not repo_link:
                return None

            full_name = repo_link.get('href', '').lstrip('/')
            name = full_name.split('/')[-1] if '/' in full_name else full_name

            # 获取描述
            desc_elem = repo_elem.find('p', class_='col-9')
            description = desc_elem.text.strip() if desc_elem else ''

            # 获取编程语言
            lang_elem = repo_elem.find('span', itemprop='programmingLanguage')
            language = lang_elem.text.strip() if lang_elem else 'Unknown'

            # 获取star数
            star_elem = repo_elem.find('a', class_='Link--muted')
            stars_text = star_elem.text.strip() if star_elem else '0'
            stars = self.parse_star_count(stars_text)

            # 获取fork数（如果存在）
            fork_elem = repo_elem.find_all('a', class_='Link--muted')
            forks = 0
            if len(fork_elem) > 1:
                fork_text = fork_elem[1].text.strip()
                forks = self.parse_star_count(fork_text)

            # 获取今天的star增长 - 尝试多种选择器
            today_stars = 0

            # 方法1: 原来的选择器
            today_stars_elem = repo_elem.find('span', class_='d-inline-block float-sm-right')
            if today_stars_elem:
                today_text = today_stars_elem.text.strip()
                today_stars = self.parse_star_count(today_text)

            # 构建项目数据
            repo_data = {
                'name': name,
                'full_name': full_name,
                'description': description,
                'language': language,
                'stargazers_count': stars,
                'forks_count': forks,
                'html_url': f'https://github.com/{full_name}',
                'created_at': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),  # 近似值
                'topics': [],  # trending页面不提供topics
                'size': 0,  # trending页面不提供size
                'license': None,  # trending页面不提供license
                'owner': {
                    'type': 'User'  # 默认值
                },
                'today_stars': today_stars  # 今日star增长
            }

            return repo_data

        except Exception as e:
            print(f"Error parsing repo element: {e}", file=sys.stderr)
            return None

    def parse_star_count(self, text: str) -> int:
        """解析star数量文本（如 '1.2k' -> 1200，或 '17,830 stars today' -> 17830）"""
        import re

        text = text.strip().replace(',', '').lower()

        # 首先尝试提取纯数字
        # 匹配数字（可能包含逗号、小数点、k等）
        number_match = re.search(r'(\d+(?:,\d+)*(?:\.\d+)?(?:k)?)', text)
        if number_match:
            num_str = number_match.group(1).replace(',', '')
            if 'k' in num_str:
                try:
                    return int(float(num_str.replace('k', '')) * 1000)
                except:
                    pass
            else:
                try:
                    # 处理小数情况，如1.2k
                    if '.' in num_str:
                        return int(float(num_str) * 1000) if 'k' in text else int(float(num_str))
                    else:
                        return int(num_str)
                except:
                    pass

        # 如果上面的方法失败，尝试提取所有连续的数字
        digits = re.findall(r'\d+', text)
        if digits:
            # 取最大的数字（通常是star数）
            return max(int(d) for d in digits)

        return 0

    def get_complete_repo_data(self, repo_full_name: str) -> Dict:
        """获取仓库的完整详细信息（从API）"""
        try:
            url = f'https://api.github.com/repos/{repo_full_name}'
            response = self.api_session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching detailed info for {repo_full_name}: {e}", file=sys.stderr)
            return {}

    def clean_readme(self, raw: str) -> str:
        """清理 README 原始 Markdown，只保留纯文字内容"""
        import re

        # 移除 HTML 注释
        raw = re.sub(r'<!--.*?-->', '', raw, flags=re.DOTALL)
        # 移除 HTML 标签（含属性）
        raw = re.sub(r'<[^>]+>', '', raw)
        # 移除图片：![alt](url) 和 ![alt][ref]
        raw = re.sub(r'!\[.*?\]\(.*?\)', '', raw)
        raw = re.sub(r'!\[.*?\]\[.*?\]', '', raw)
        # 移除链接引用定义：[ref]: url 或 [ref]: url "title"
        raw = re.sub(r'^\[.*?\]:\s*\S+.*$', '', raw, flags=re.MULTILINE)
        # 保留链接文字，去掉 URL：[text](url) -> text
        raw = re.sub(r'\[([^\]]*)\]\(.*?\)', r'\1', raw)
        # 移除独立的 URL（http/https）
        raw = re.sub(r'https?://\S+', '', raw)
        # 移除 Markdown 代码块（```...```）
        raw = re.sub(r'```.*?```', '', raw, flags=re.DOTALL)
        # 移除行内代码（`code`）
        raw = re.sub(r'`[^`]*`', '', raw)
        # 移除标题符号 #
        raw = re.sub(r'^#{1,6}\s*', '', raw, flags=re.MULTILINE)
        # 移除粗体/斜体符号
        raw = re.sub(r'\*{1,3}([^*]*)\*{1,3}', r'\1', raw)
        raw = re.sub(r'_{1,3}([^_]*)_{1,3}', r'\1', raw)
        # 移除表格分隔行（|---|---|）
        raw = re.sub(r'^\|[\s\-:|]+\|.*$', '', raw, flags=re.MULTILINE)
        # 移除列表符号
        raw = re.sub(r'^[\s]*[-*+]\s+', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'^[\s]*\d+\.\s+', '', raw, flags=re.MULTILINE)
        # 移除引用符号
        raw = re.sub(r'^>\s*', '', raw, flags=re.MULTILINE)
        # 合并多余空行
        raw = re.sub(r'\n{3,}', '\n\n', raw)
        # 将所有换行、制表符等空白字符替换为单个空格
        raw = re.sub(r'[\n\r\t]+', ' ', raw)
        # 合并连续空格为单个空格
        raw = re.sub(r' {2,}', ' ', raw)

        return raw.strip()

    def get_repo_readme(self, repo_full_name: str) -> str:
        """获取仓库 README，返回清理后的纯文字内容"""
        try:
            import base64

            readme_url = f'https://api.github.com/repos/{repo_full_name}/readme'
            response = self.api_session.get(readme_url)
            response.raise_for_status()

            readme_data = response.json()
            raw = base64.b64decode(readme_data['content']).decode('utf-8', errors='ignore')
            content = self.clean_readme(raw)

            if len(content) > 3000:
                content = content[:3000] + "..."

            return content

        except Exception as e:
            print(f"Error fetching README for {repo_full_name}: {e}", file=sys.stderr)
            return ""

    def format_stars(self, count: int) -> str:
        """将 star 数格式化为易读字符串，如 19800 -> '19.8K'"""
        if count >= 1000:
            value = count / 1000
            # 保留一位小数，去掉末尾的 .0
            formatted = f"{value:.1f}".rstrip('0').rstrip('.')
            return f"{formatted}K"
        return str(count)

    def format_today_stars(self, count: int) -> str:
        """今日 star 增长格式化，如 3619 -> '+3,619'"""
        if count <= 0:
            return "+0"
        return f"+{count:,}"

    def prepare_structured_data(self, repos: List[Dict], limit: int) -> Dict:
        """准备结构化输出数据"""
        repo_names = [repo['full_name'] for repo in repos if repo.get('full_name')]

        # 并行获取 README 和详细信息
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            readme_futures = {executor.submit(self.get_repo_readme, name): name for name in repo_names}
            detail_futures = {executor.submit(self.get_complete_repo_data, name): name for name in repo_names}

            readme_contents: Dict[str, str] = {}
            for future in concurrent.futures.as_completed(readme_futures):
                name = readme_futures[future]
                try:
                    readme_contents[name] = future.result()
                except Exception as exc:
                    print(f'README fetch for {name} failed: {exc}', file=sys.stderr)
                    readme_contents[name] = ""

            repo_details: Dict[str, Dict] = {}
            for future in concurrent.futures.as_completed(detail_futures):
                name = detail_futures[future]
                try:
                    repo_details[name] = future.result()
                except Exception as exc:
                    print(f'Detail fetch for {name} failed: {exc}', file=sys.stderr)
                    repo_details[name] = {}

        projects = []
        for rank, repo in enumerate(repos, start=1):
            full_name = repo.get('full_name', '')
            detailed = repo_details.get(full_name, {})

            total_stars = detailed.get('stargazers_count') or repo.get('stargazers_count', 0)
            total_forks = detailed.get('forks_count') or repo.get('forks_count', 0)

            projects.append({
                'rank': rank,
                'name': full_name,
                'description': repo.get('description', '').strip() or 'This project has no description.',
                'language': repo.get('language', 'Unknown'),
                'todayStars': self.format_today_stars(repo.get('today_stars', 0)),
                'totalStars': self.format_stars(total_stars),
                'totalForks': self.format_stars(total_forks),
                'readmeContent': readme_contents.get(full_name, ''),
                'imageUrl': f"https://opengraph.githubassets.com/1/{full_name}",
            })

        return {
            'date': datetime.now().strftime('%Y.%m.%d'),
            'title': 'GitHub Trending',
            'subtitle': '今日热榜',
            'topN': limit,
            'projects': projects,
        }

    def output_structured_data(self, language: Optional[str] = None, limit: int = 10) -> None:
        """输出结构化数据供 Claude 处理"""
        repos = self.fetch_from_trending_page(language, limit)

        if not repos:
            print("ERROR: Failed to fetch GitHub trending data", file=sys.stderr)
            sys.exit(1)

        result = self.prepare_structured_data(repos, limit)
        print(json.dumps(result, indent=2, ensure_ascii=False))


def main():
    """主函数：从 config.env 读取默认值，命令行参数可覆盖"""
    analyzer = GitHubTrendingAnalyzer()

    # 从 config.env 中读取默认值
    config_language = analyzer.config.get('DEFAULT_LANGUAGE', '').strip()
    language: Optional[str] = config_language if config_language else None

    config_limit = analyzer.config.get('DEFAULT_LIMIT', '10').strip()
    try:
        limit = int(config_limit)
    except ValueError:
        limit = 10

    args = sys.argv[1:]

    # 第一个参数：编程语言（可覆盖 config.env 中的 DEFAULT_LANGUAGE）
    if args:
        arg_lang = args[0].strip()
        if arg_lang and arg_lang.lower() != 'none':
            language = arg_lang
        else:
            language = None

        # 第二个参数：项目数量（可覆盖 config.env 中的 DEFAULT_LIMIT）
        if len(args) > 1:
            try:
                limit = int(args[1])
            except ValueError:
                print(f"Warning: Invalid limit value '{args[1]}', using config/default: {limit}", file=sys.stderr)

    # 限制在合理范围内
    limit = max(1, min(25, limit))

    # 输出结构化数据
    try:
        analyzer.output_structured_data(language, limit)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
