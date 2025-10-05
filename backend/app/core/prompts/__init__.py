"""
Prompt Manager - Handles Jinja2 template loading and rendering.

This module provides utilities for loading and rendering Jinja2 templates
used in AI agent prompts.
"""

import os
from pathlib import Path
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader, Template


class PromptManager:
    """
    Manages Jinja2 templates for AI agent prompts.

    This class handles loading and rendering of prompt templates
    from the prompts directory.
    """

    def __init__(self, prompts_dir: str = None):
        """
        Initialize the PromptManager.

        Args:
            prompts_dir: Path to the prompts directory. If None, uses default location.
        """
        if prompts_dir is None:
            # Default to the prompts directory relative to this file
            current_dir = Path(__file__).parent
            prompts_dir = current_dir

        self.prompts_dir = Path(prompts_dir)
        self.env = Environment(
            loader=FileSystemLoader(self.prompts_dir),
            autoescape=False,  # We don't need HTML escaping for prompts
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def render_template(self, template_name: str, **kwargs: Any) -> str:
        """
        Render a Jinja2 template with the provided variables.

        Args:
            template_name: Name of the template file (e.g., 'analyst_recommendation.j2')
            **kwargs: Variables to pass to the template

        Returns:
            Rendered template as a string

        Raises:
            FileNotFoundError: If the template file doesn't exist
            jinja2.TemplateError: If there's an error rendering the template
        """
        try:
            template = self.env.get_template(template_name)
            return template.render(**kwargs)
        except Exception as e:
            raise Exception(f"Error rendering template '{template_name}': {str(e)}")

    def get_template(self, template_name: str) -> Template:
        """
        Get a Jinja2 template object.

        Args:
            template_name: Name of the template file

        Returns:
            Jinja2 Template object
        """
        return self.env.get_template(template_name)

    def list_templates(self) -> list[str]:
        """
        List all available templates.

        Returns:
            List of template filenames
        """
        return self.env.list_templates()


# Global prompt manager instance
prompt_manager = PromptManager()
